/**
 * Offline Returns Integration Test Harness (Phase 5)
 *
 * Validates:
 * 1) Replay behavior for processed and draft returns
 * 2) Variant fail-fast safety before side effects
 * 3) Tenant isolation hard-fail paths
 * 4) Concurrency and completion-check protections
 *
 * Requires:
 * - Local app running at http://localhost:3000
 * - .env.local with Supabase service-role credentials
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.OFFLINE_TEST_BASE_URL || 'http://localhost:3000'
const TENANT_ID = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const created = {
  orders: [],
  returns: [],
  returnItems: [],
  orderItems: [],
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

async function api(path, method = 'GET', body) {
  return apiWithHeaders(path, method, body, {
    'Content-Type': 'application/json',
    'x-tenant-admin': 'senlysh',
  })
}

async function apiWithHeaders(path, method = 'GET', body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  return { ok: res.ok, status: res.status, data }
}

async function hasEffectTrackingColumns() {
  const { error } = await supabase
    .from('order_return_effects')
    .select('id, applied_at, last_error')
    .limit(1)

  return !error
}

async function findFixture() {
  const { data: customer, error: cErr } = await supabase
    .from('customers')
    .select('id, tenant_id, email')
    .eq('tenant_id', TENANT_ID)
    .limit(1)
    .maybeSingle()

  if (cErr || !customer) throw new Error(`Customer fixture missing: ${cErr?.message || 'none'}`)

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, tenant_id, name, sku, price_cents, stock, track_inventory, has_variants, status, is_sold_out')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'published')
    .or('is_sold_out.is.null,is_sold_out.eq.false')
    .limit(2)

  if (pErr || !products || products.length === 0) {
    throw new Error(`Product fixture missing: ${pErr?.message || 'none'}`)
  }

  return {
    customer,
    products: products.map((p) => ({
      ...p,
      price_cents: Math.max(100, Number(p.price_cents || 0)),
    })),
  }
}

async function findInventoryRestockFixtureProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, tenant_id, name, sku, price_cents, stock, track_inventory, has_variants, status, is_sold_out')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'published')
    .eq('has_variants', false)
    .eq('track_inventory', true)
    .or('is_sold_out.is.null,is_sold_out.eq.false')
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Failed to load restock fixture product: ${error.message}`)
  if (!data) return null
  return {
    ...data,
    price_cents: Math.max(100, Number(data.price_cents || 0)),
  }
}

async function createDraftReturnSeed(params) {
  const {
    order,
    orderItem,
    clientRequestId,
    walletRefundCents,
    cashRefundCents,
    cashbackReversalCents = 0,
    restockQuantity,
  } = params

  const totalReturnCents = walletRefundCents + cashRefundCents

  const { data: header, error: headerErr } = await supabase
    .from('order_returns')
    .insert({
      tenant_id: TENANT_ID,
      order_id: order.id,
      customer_id: order.customer_id,
      return_number: uid('OFFRET_SEED'),
      status: 'draft',
      reason: 'seed-draft',
      notes: 'seeded by test harness',
      total_return_cents: totalReturnCents,
      wallet_refund_cents: walletRefundCents,
      cash_refund_cents: cashRefundCents,
      cashback_reversal_cents: cashbackReversalCents,
      client_request_id: clientRequestId,
    })
    .select('id, return_number')
    .single()

  if (headerErr || !header) throw new Error(`Failed to seed draft return header: ${headerErr?.message || 'unknown'}`)
  created.returns.push(header.id)

  const { data: line, error: lineErr } = await supabase
    .from('order_return_items')
    .insert({
      tenant_id: TENANT_ID,
      order_return_id: header.id,
      order_item_id: orderItem.id,
      product_id: orderItem.product_id,
      returned_quantity: 1,
      restock_quantity: restockQuantity,
      unit_price_cents: orderItem.unit_price_cents,
      return_subtotal_cents: totalReturnCents,
      reason: 'seed-draft-line',
    })
    .select('id')
    .single()

  if (lineErr || !line) throw new Error(`Failed to seed draft return line: ${lineErr?.message || 'unknown'}`)
  created.returnItems.push(line.id)

  return { header, line }
}

async function createPaidOfflineOrder(customerId, items) {
  const orderNumber = uid('OFFRET_TEST')
  const total = items.reduce((sum, item) => sum + item.price_cents * item.qty, 0)
  const walletUsed = Math.floor(total * 0.3)
  const cashPaid = total - walletUsed

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      tenant_id: TENANT_ID,
      order_number: orderNumber,
      customer_id: customerId,
      email: 'offline-return-test@example.com',
      status: 'paid',
      total_cents: total,
      wallet_used_cents: walletUsed,
      cash_paid_cents: cashPaid,
      payment_provider: 'offline_admin',
      payment_env: 'test',
      currency: 'INR',
      order_source: 'offline_admin',
      post_payment_processed: true,
      cashback_amount_cents: Math.max(0, Math.floor(total * 0.05)),
    })
    .select('id, order_number, total_cents, wallet_used_cents, cash_paid_cents, cashback_amount_cents')
    .single()

  if (orderErr || !order) throw new Error(`Order create failed: ${orderErr?.message || 'unknown'}`)
  created.orders.push(order.id)

  const payload = items.map((item) => ({
    tenant_id: TENANT_ID,
    order_id: order.id,
    product_id: item.id,
    quantity: item.qty,
    unit_price_cents: item.price_cents,
    subtotal_cents: item.price_cents * item.qty,
  }))

  const { data: insertedItems, error: itemsErr } = await supabase
    .from('order_items')
    .insert(payload)
    .select('id, order_id, product_id, quantity, unit_price_cents')

  if (itemsErr || !insertedItems) throw new Error(`Order items create failed: ${itemsErr?.message || 'unknown'}`)

  for (const row of insertedItems) created.orderItems.push(row.id)

  return { order, orderItems: insertedItems }
}

async function cleanup() {
  for (const id of created.returnItems.reverse()) {
    await supabase.from('order_return_items').delete().eq('id', id)
  }

  for (const id of created.returns.reverse()) {
    await supabase.from('order_return_effects').delete().eq('order_return_id', id)
    await supabase.from('order_returns').delete().eq('id', id)
    await supabase.from('wallet_ledger').delete().eq('reference_id', id)
  }

  for (const id of created.orderItems.reverse()) {
    await supabase.from('order_items').delete().eq('id', id)
  }

  for (const id of created.orders.reverse()) {
    await supabase.from('cashback_transactions').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
  }
}

async function run() {
  const results = []

  try {
    const effectSchemaReady = await hasEffectTrackingColumns()
    results.push({
      name: 'Effect tracking schema hardened (applied_at + last_error present)',
      pass: effectSchemaReady,
      details: effectSchemaReady ? 'ok' : 'missing hardened columns',
    })

    if (!effectSchemaReady) {
      throw new Error('Required hardened schema missing for strict safety mode')
    }

    const fixture = await findFixture()
    const primary = fixture.products[0]
    const secondary = fixture.products[1] || fixture.products[0]
    const primaryRestockQty = primary.has_variants ? 0 : 1
    const restockProduct = await findInventoryRestockFixtureProduct()

    const { order, orderItems } = await createPaidOfflineOrder(fixture.customer.id, [
      { ...primary, qty: 3 },
      { ...secondary, qty: 2 },
    ])
    const firstItem = orderItems[0]

    const duplicateKey = uid('dup_key')
    const duplicateLineTotal = (firstItem.unit_price_cents || 0) * 1
    const duplicatePayload = {
      clientRequestId: duplicateKey,
      reason: 'duplicate-submit-check',
      walletRefundCents: 0,
      cashRefundCents: duplicateLineTotal,
      items: [
        {
          orderItemId: firstItem.id,
          returnedQuantity: 1,
          restockQuantity: primaryRestockQty,
        },
      ],
    }

    const first = await api(`/api/admin/orders/${order.id}/returns`, 'POST', duplicatePayload)
    const second = await api(`/api/admin/orders/${order.id}/returns`, 'POST', duplicatePayload)

    if (first.data?.return?.id) created.returns.push(first.data.return.id)
    if (first.data?.items) first.data.items.forEach((x) => created.returnItems.push(x.id))

    results.push({
      name: 'Same request id replay with status processed returns replayed success only',
      pass: first.ok && second.ok && first.data?.return?.id === second.data?.return?.id && !!second.data?.return?.replayed,
      details: `first=${first.status}, second=${second.status}, replayed=${!!second.data?.return?.replayed}`,
    })

    if (restockProduct) {
      const { order: draftOrder, orderItems: draftOrderItems } = await createPaidOfflineOrder(fixture.customer.id, [
        { ...restockProduct, qty: 1 },
      ])
      const draftOrderItem = draftOrderItems[0]
      const draftLineTotal = draftOrderItem.unit_price_cents
      const draftWalletRefund = Math.min(draftOrder.wallet_used_cents || 0, draftLineTotal)
      const draftCashRefund = draftLineTotal - draftWalletRefund
      const draftKey = uid('draft_resume')
      await createDraftReturnSeed({
        order: { ...draftOrder, customer_id: fixture.customer.id },
        orderItem: draftOrderItem,
        clientRequestId: draftKey,
        walletRefundCents: draftWalletRefund,
        cashRefundCents: draftCashRefund,
        restockQuantity: 1,
      })

      const resumed = await api(`/api/admin/orders/${draftOrder.id}/returns`, 'POST', {
        clientRequestId: draftKey,
        reason: 'resume-draft',
        walletRefundCents: draftWalletRefund,
        cashRefundCents: draftCashRefund,
        items: [
          {
            orderItemId: draftOrderItem.id,
            returnedQuantity: 1,
            restockQuantity: 1,
          },
        ],
      })

      const { data: resumedHeader } = await supabase
        .from('order_returns')
        .select('id, status')
        .eq('tenant_id', TENANT_ID)
        .eq('order_id', draftOrder.id)
        .eq('client_request_id', draftKey)
        .single()

      results.push({
        name: 'Same request id replay with status draft resumes and finishes cleanly',
        pass: resumed.ok && resumedHeader?.status === 'processed',
        details: `status=${resumedHeader?.status || 'unknown'}, response=${resumed.status}`,
      })
    } else {
      results.push({
        name: 'Same request id replay with status draft resumes and finishes cleanly',
        pass: false,
        details: 'no non-variant track_inventory fixture product available',
      })
    }

    const variantProduct = fixture.products.find((p) => p.has_variants)
    if (variantProduct) {
      const { order: variantOrder, orderItems: variantItems } = await createPaidOfflineOrder(fixture.customer.id, [
        { ...variantProduct, qty: 1 },
      ])

      const variantFail = await api(`/api/admin/orders/${variantOrder.id}/returns`, 'POST', {
        clientRequestId: uid('variant_fail_fast'),
        reason: 'variant-fail-fast',
        walletRefundCents: variantItems[0].unit_price_cents,
        cashRefundCents: 0,
        items: [
          {
            orderItemId: variantItems[0].id,
            returnedQuantity: 1,
            restockQuantity: 1,
          },
        ],
      })

      const { data: seededReturn } = await supabase
        .from('order_returns')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('order_id', variantOrder.id)
        .eq('reason', 'variant-fail-fast')
        .maybeSingle()

      results.push({
        name: 'Variant restock request fails before any side effects',
        pass: !variantFail.ok && !seededReturn?.id,
        details: `status=${variantFail.status}, createdHeader=${!!seededReturn?.id}`,
      })
    } else {
      results.push({
        name: 'Variant restock request fails before any side effects',
        pass: false,
        details: 'no variant fixture product available',
      })
    }

    const missingTenant = await apiWithHeaders(
      `/api/admin/orders/${order.id}/returns`,
      'POST',
      duplicatePayload,
      { 'Content-Type': 'application/json' }
    )

    const wrongTenant = await apiWithHeaders(
      `/api/admin/orders/${order.id}/returns`,
      'POST',
      duplicatePayload,
      { 'Content-Type': 'application/json', 'x-tenant-admin': 'bluebell' }
    )

    results.push({
      name: 'Cross-tenant and missing-tenant requests fail hard',
      pass: !missingTenant.ok && !wrongTenant.ok,
      details: `missing=${missingTenant.status}, wrong=${wrongTenant.status}`,
    })

    if (restockProduct) {
      const { order: concurrentOrder, orderItems: concurrentItems } = await createPaidOfflineOrder(fixture.customer.id, [
        { ...restockProduct, qty: 1 },
      ])
      const concurrentLineTotal = concurrentItems[0].unit_price_cents
      const concurrentWalletRefund = Math.min(concurrentOrder.wallet_used_cents || 0, concurrentLineTotal)
      const concurrentCashRefund = concurrentLineTotal - concurrentWalletRefund
      const concurrentPayload = (key) => ({
        clientRequestId: key,
        reason: 'concurrent-partial-return',
        walletRefundCents: concurrentWalletRefund,
        cashRefundCents: concurrentCashRefund,
        items: [
          {
            orderItemId: concurrentItems[0].id,
            returnedQuantity: 1,
            restockQuantity: 1,
          },
        ],
      })

      const [c1, c2] = await Promise.all([
        api(`/api/admin/orders/${concurrentOrder.id}/returns`, 'POST', concurrentPayload(uid('concurrent_a'))),
        api(`/api/admin/orders/${concurrentOrder.id}/returns`, 'POST', concurrentPayload(uid('concurrent_b'))),
      ])

      const successCount = [c1, c2].filter((x) => x.ok).length
      const failCount = [c1, c2].filter((x) => !x.ok).length

      results.push({
        name: 'Concurrent partial returns on same line cannot both pass over bounds',
        pass: successCount === 1 && failCount === 1,
        details: `success=${successCount}, fail=${failCount}`,
      })
    } else {
      results.push({
        name: 'Concurrent partial returns on same line cannot both pass over bounds',
        pass: false,
        details: 'no non-variant track_inventory fixture product available',
      })
    }

    if (restockProduct) {
      const { order: crashOrder, orderItems: crashItems } = await createPaidOfflineOrder(fixture.customer.id, [
        { ...restockProduct, qty: 1 },
      ])
      const crashLineTotal = crashItems[0].unit_price_cents
      const crashWalletRefund = Math.min(crashOrder.wallet_used_cents || 0, crashLineTotal)
      const crashCashRefund = crashLineTotal - crashWalletRefund
      const crashKey = uid('resume_after_wallet')
      const seeded = await createDraftReturnSeed({
        order: { ...crashOrder, customer_id: fixture.customer.id },
        orderItem: crashItems[0],
        clientRequestId: crashKey,
        walletRefundCents: crashWalletRefund,
        cashRefundCents: crashCashRefund,
        restockQuantity: 1,
      })

      const walletAccount = await supabase
        .from('wallet_accounts')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('customer_id', fixture.customer.id)
        .maybeSingle()

      if (!walletAccount.data?.id) {
        throw new Error('Missing wallet account fixture for resume-after-wallet test')
      }

      const { error: seedWalletError } = await supabase.from('wallet_ledger').insert({
        account_id: walletAccount.data.id,
        tenant_id: TENANT_ID,
        entry_type: 'credit',
        amount_cents: crashWalletRefund,
        currency: 'INR',
        source_key: 'RETURN_REFUND',
        reference_id: seeded.header.id,
        metadata: { seeded: true, reason: 'simulate-wallet-complete-before-crash' },
      })

      if (seedWalletError) {
        throw new Error(`Failed to seed wallet ledger for resume test: ${seedWalletError.message}`)
      }

      const { error: seedEffectError } = await supabase.from('order_return_effects').insert({
        tenant_id: TENANT_ID,
        order_return_id: seeded.header.id,
        order_return_item_id: null,
        effect_type: 'wallet_refund',
        reference_id: crashOrder.id,
        metadata: { seeded: true },
        applied_at: new Date().toISOString(),
      })

      if (seedEffectError && seedEffectError.code !== '23505') {
        throw new Error(`Failed to seed wallet effect completion marker: ${seedEffectError.message}`)
      }

      const resumedAfterWallet = await api(`/api/admin/orders/${crashOrder.id}/returns`, 'POST', {
        clientRequestId: crashKey,
        reason: 'resume-after-wallet',
        walletRefundCents: crashWalletRefund,
        cashRefundCents: crashCashRefund,
        items: [
          {
            orderItemId: crashItems[0].id,
            returnedQuantity: 1,
            restockQuantity: 1,
          },
        ],
      })

      const { data: walletRows, error: walletRowsError } = await supabase
        .from('wallet_ledger')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('source_key', 'RETURN_REFUND')
        .eq('reference_id', seeded.header.id)

      if (walletRowsError) {
        throw new Error(`Failed to inspect wallet rows after resume: ${walletRowsError.message}`)
      }

      results.push({
        name: 'Crash after wallet before stock resumes without double-credit',
        pass: resumedAfterWallet.ok && (walletRows || []).length === 1,
        details: `response=${resumedAfterWallet.status}, walletCredits=${(walletRows || []).length}`,
      })

      const { order: completionOrder, orderItems: completionItems } = await createPaidOfflineOrder(fixture.customer.id, [
        { ...restockProduct, qty: 1 },
      ])
      const completionLineTotal = completionItems[0].unit_price_cents
      const completionWalletRefund = Math.min(completionOrder.wallet_used_cents || 0, completionLineTotal)
      const completionCashRefund = completionLineTotal - completionWalletRefund
      const completionKey = uid('completion_check')

      const completionSeed = await createDraftReturnSeed({
        order: { ...completionOrder, customer_id: fixture.customer.id },
        orderItem: completionItems[0],
        clientRequestId: completionKey,
        walletRefundCents: completionWalletRefund,
        cashRefundCents: completionCashRefund,
        restockQuantity: 1,
      })

      const { error: pendingEffectError } = await supabase.from('order_return_effects').insert({
        tenant_id: TENANT_ID,
        order_return_id: completionSeed.header.id,
        order_return_item_id: null,
        effect_type: 'wallet_refund',
        reference_id: completionOrder.id,
        metadata: { seeded: true, state: 'pending' },
        applied_at: null,
      })

      if (pendingEffectError && pendingEffectError.code !== '23505') {
        throw new Error(`Failed to seed pending wallet effect marker: ${pendingEffectError.message}`)
      }

      const completionResume = await api(`/api/admin/orders/${completionOrder.id}/returns`, 'POST', {
        clientRequestId: completionKey,
        reason: 'completion-check-resume',
        walletRefundCents: completionWalletRefund,
        cashRefundCents: completionCashRefund,
        items: [
          {
            orderItemId: completionItems[0].id,
            returnedQuantity: 1,
            restockQuantity: 1,
          },
        ],
      })

      const { data: completionWalletRows, error: completionWalletRowsError } = await supabase
        .from('wallet_ledger')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('source_key', 'RETURN_REFUND')
        .eq('reference_id', completionSeed.header.id)

      if (completionWalletRowsError) {
        throw new Error(`Failed to inspect completion-check wallet rows: ${completionWalletRowsError.message}`)
      }

      results.push({
        name: 'Completion checks do not treat unapplied effect markers as done',
        pass: completionResume.ok && (completionWalletRows || []).length === 1,
        details: `response=${completionResume.status}, walletCredits=${(completionWalletRows || []).length}`,
      })
    } else {
      results.push({
        name: 'Crash after wallet before stock resumes without double-credit',
        pass: false,
        details: 'no non-variant track_inventory fixture product available',
      })
      results.push({
        name: 'Completion checks do not treat unapplied effect markers as done',
        pass: false,
        details: 'no non-variant track_inventory fixture product available',
      })
    }

    const { data: processedReturnForCancel } = await supabase
      .from('order_returns')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'processed')
      .limit(1)
      .maybeSingle()

    let dbCancelBlocked = false
    if (processedReturnForCancel?.id) {
      const { error: cancelErr } = await supabase
        .from('order_returns')
        .update({ status: 'cancelled' })
        .eq('tenant_id', TENANT_ID)
        .eq('id', processedReturnForCancel.id)
      dbCancelBlocked = !!cancelErr
    }

    results.push({
      name: 'Processed return cancellation is blocked at DB level',
      pass: dbCancelBlocked,
      details: `blocked=${dbCancelBlocked}`,
    })

    console.log('\n=== OFFLINE RETURNS TEST RESULTS ===\n')
    for (const r of results) {
      console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.details ? ` | ${r.details}` : ''}`)
    }
    const passed = results.filter((r) => r.pass).length
    console.log(`\nSummary: ${passed}/${results.length} passed`)

    if (passed !== results.length) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Harness failed:', error)
    process.exitCode = 1
  } finally {
    await cleanup()
  }
}

run()
