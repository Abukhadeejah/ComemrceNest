/**
 * Offline Admin Orders Integration Test Harness
 *
 * Executes a best-effort integration pass for offline/admin order scenarios.
 * Requires:
 * - .env.local with Supabase URL + service role key
 * - local app running at http://localhost:3000
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.OFFLINE_TEST_BASE_URL || 'http://localhost:3000'
const SENLYSH_TENANT_ID = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const created = {
  customers: [],
  orders: [],
  orderItems: [],
}

let hasOrderSourceColumn = true

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

async function api(path, method = 'GET', body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  let data
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  return { status: res.status, ok: res.ok, data }
}

async function findTenantFixture(tenantId) {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, tenant_id, email, phone, first_name, last_name')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle()

  if (customerError) throw new Error(`Customer lookup failed: ${customerError.message}`)

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, tenant_id, name, sku, price_cents, cost_per_item_cents, status, is_sold_out')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .or('is_sold_out.is.null,is_sold_out.eq.false')
    .limit(1)
    .maybeSingle()

  if (productError) throw new Error(`Product lookup failed: ${productError.message}`)

  if (!customer || !product) {
    throw new Error(`Missing fixture data for tenant ${tenantId}. Need at least 1 customer and 1 published product.`)
  }

  return { customer, product }
}

async function createCustomer(tenantId) {
  const stamp = uid('offline_new_customer')
  const payload = {
    tenant_id: tenantId,
    email: `${stamp}@example.com`,
    phone: `${Math.floor(1000000000 + Math.random() * 8999999999)}`,
    first_name: 'Offline',
    last_name: 'NewCustomer',
    marketing_opt_in: false,
  }

  const { data, error } = await supabase.from('customers').insert(payload).select('id, email, phone, tenant_id').single()
  if (error) throw new Error(`Create customer failed: ${error.message}`)

  created.customers.push(data.id)
  return data
}

async function createOrderWithItem({ tenantId, customerId, product, status, walletUsedCents = 0, cashPaidCents = null }) {
  const orderNumber = uid('OFF_TEST')
  const total = Number(product.price_cents || 0)
  const cash = cashPaidCents == null ? Math.max(0, total - walletUsedCents) : cashPaidCents

  const payload = {
    tenant_id: tenantId,
    order_number: orderNumber,
    customer_id: customerId,
    email: 'offline-test@example.com',
    status,
    total_cents: total,
    wallet_used_cents: walletUsedCents,
    cash_paid_cents: cash,
    discount_amount_cents: 0,
    payment_provider: 'offline_admin',
    payment_env: 'test',
    currency: 'INR',
    post_payment_processed: false,
    order_source: 'offline_admin',
  }

  let order = null
  let orderError = null

  if (hasOrderSourceColumn) {
    const result = await supabase
      .from('orders')
      .insert(payload)
      .select('id, order_number, tenant_id, customer_id, status, total_cents, wallet_used_cents, cash_paid_cents, order_source')
      .single()
    order = result.data
    orderError = result.error

    if (orderError && /order_source/.test(orderError.message || '')) {
      hasOrderSourceColumn = false
      const { order_source, ...withoutOrderSource } = payload
      const retry = await supabase
        .from('orders')
        .insert(withoutOrderSource)
        .select('id, order_number, tenant_id, customer_id, status, total_cents, wallet_used_cents, cash_paid_cents')
        .single()
      order = retry.data
      orderError = retry.error
    }
  } else {
    const { order_source, ...withoutOrderSource } = payload
    const retry = await supabase
      .from('orders')
      .insert(withoutOrderSource)
      .select('id, order_number, tenant_id, customer_id, status, total_cents, wallet_used_cents, cash_paid_cents')
      .single()
    order = retry.data
    orderError = retry.error
  }

  if (orderError) throw new Error(`Create order failed: ${orderError.message}`)
  created.orders.push(order.id)

  const { data: item, error: itemError } = await supabase
    .from('order_items')
    .insert({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: product.id,
      quantity: 1,
      unit_price_cents: total,
      subtotal_cents: total,
    })
    .select('id, order_id, product_id')
    .single()

  if (itemError) throw new Error(`Create order item failed: ${itemError.message}`)
  created.orderItems.push(item.id)

  return order
}

async function countLedgerDebits(orderId) {
  const { count, error } = await supabase
    .from('wallet_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('reference_id', orderId)
    .eq('source_key', 'ORDER_PAYMENT')
    .eq('entry_type', 'debit')

  if (error) throw new Error(`Ledger count failed: ${error.message}`)
  return count || 0
}

async function countCashbackTx(orderId) {
  const { count, error } = await supabase
    .from('cashback_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)

  if (error) throw new Error(`Cashback count failed: ${error.message}`)
  return count || 0
}

async function getOrder(orderId) {
  let data = null
  let error = null

  if (hasOrderSourceColumn) {
    const result = await supabase
      .from('orders')
      .select('id, tenant_id, status, order_source, post_payment_processed, customer_id')
      .eq('id', orderId)
      .single()
    data = result.data
    error = result.error

    if (error && /order_source/.test(error.message || '')) {
      hasOrderSourceColumn = false
      const fallback = await supabase
        .from('orders')
        .select('id, tenant_id, status, post_payment_processed, customer_id')
        .eq('id', orderId)
        .single()
      data = fallback.data
      error = fallback.error
    }
  } else {
    const fallback = await supabase
      .from('orders')
      .select('id, tenant_id, status, post_payment_processed, customer_id')
      .eq('id', orderId)
      .single()
    data = fallback.data
    error = fallback.error
  }

  if (error) throw new Error(`Get order failed: ${error.message}`)
  return data
}

async function getAnotherTenant(excludeTenantId) {
  const { data, error } = await supabase
    .from('products')
    .select('tenant_id')
    .neq('tenant_id', excludeTenantId)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Other tenant lookup failed: ${error.message}`)
  return data?.tenant_id || null
}

async function findTenantCustomerProduct(tenantId) {
  const { data: customer } = await supabase
    .from('customers')
    .select('id, tenant_id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle()

  const { data: product } = await supabase
    .from('products')
    .select('id, tenant_id, name')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle()

  return { customer, product }
}

async function verifyBadgeCodePresence() {
  const fs = require('fs')
  const listFile = 'src/app/(admin)/admin/orders/OrderTable.tsx'
  const detailFile = 'src/app/(admin)/admin/order-details/[id]/page.tsx'

  const listText = fs.readFileSync(listFile, 'utf8')
  const detailText = fs.readFileSync(detailFile, 'utf8')

  return {
    listHasOfflineBadge: listText.includes('Offline Admin'),
    listHasOnlineBadge: listText.includes('Online'),
    detailHasOrderSource: detailText.includes('Order Source'),
  }
}

async function cleanup() {
  for (const orderItemId of created.orderItems.reverse()) {
    await supabase.from('order_items').delete().eq('id', orderItemId)
  }

  for (const orderId of created.orders.reverse()) {
    await supabase.from('cashback_transactions').delete().eq('order_id', orderId)
    await supabase.from('wallet_ledger').delete().eq('reference_id', orderId)
    await supabase.from('orders').delete().eq('id', orderId)
  }

  for (const customerId of created.customers.reverse()) {
    await supabase.from('wallet_accounts').delete().eq('customer_id', customerId)
    await supabase.from('customers').delete().eq('id', customerId)
  }
}

async function run() {
  const results = []

  try {
    const health = await api('/api/health')
    if (!health.ok) {
      throw new Error(`Server health check failed at ${BASE_URL}/api/health (${health.status})`)
    }

    const fixture = await findTenantFixture(SENLYSH_TENANT_ID)

    const existingOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: fixture.customer.id,
      product: fixture.product,
      status: 'paid',
      walletUsedCents: 0,
    })
    results.push({ name: 'Create offline order for existing customer', pass: !!existingOrder.id })

    const newCustomer = await createCustomer(SENLYSH_TENANT_ID)
    const newCustomerOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: newCustomer.id,
      product: fixture.product,
      status: 'paid',
      walletUsedCents: 0,
    })
    results.push({ name: 'Create offline order for new customer', pass: !!newCustomerOrder.id })

    const pendingOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: fixture.customer.id,
      product: fixture.product,
      status: 'pending',
      walletUsedCents: 0,
    })

    const markOnce = await api(`/api/admin/orders/${pendingOrder.id}/mark-paid`, 'POST')
    const afterFirst = await getOrder(pendingOrder.id)
    results.push({
      name: 'Create pending order, then mark paid once',
      pass: markOnce.ok && afterFirst.status === 'paid',
      details: `status=${afterFirst.status}, api=${markOnce.status}`,
    })

    const markTwice = await api(`/api/admin/orders/${pendingOrder.id}/mark-paid`, 'POST')
    const debitCountAfterTwice = await countLedgerDebits(pendingOrder.id)
    const cashbackCountAfterTwice = await countCashbackTx(pendingOrder.id)
    results.push({
      name: 'Try to mark paid twice',
      pass: markTwice.ok && debitCountAfterTwice <= 1 && cashbackCountAfterTwice <= 1,
      details: `api=${markTwice.status}, debits=${debitCountAfterTwice}, cashbackTx=${cashbackCountAfterTwice}`,
    })

    const walletUsedOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: fixture.customer.id,
      product: fixture.product,
      status: 'paid',
      walletUsedCents: Math.floor((fixture.product.price_cents || 0) / 2),
      cashPaidCents: (fixture.product.price_cents || 0) - Math.floor((fixture.product.price_cents || 0) / 2),
    })
    await api(`/api/admin/orders/${walletUsedOrder.id}/mark-paid`, 'POST')
    results.push({ name: 'Create paid order with wallet usage', pass: true, details: `order=${walletUsedOrder.id}` })

    const noWalletOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: fixture.customer.id,
      product: fixture.product,
      status: 'paid',
      walletUsedCents: 0,
      cashPaidCents: fixture.product.price_cents || 0,
    })
    await api(`/api/admin/orders/${noWalletOrder.id}/mark-paid`, 'POST')
    results.push({ name: 'Create paid order without wallet usage', pass: true, details: `order=${noWalletOrder.id}` })

    const walletDebits = await countLedgerDebits(walletUsedOrder.id)
    results.push({
      name: 'Verify one and only one ledger debit',
      pass: walletDebits === 1,
      details: `debits=${walletDebits}`,
    })

    const cashbackTx = await countCashbackTx(noWalletOrder.id)
    results.push({
      name: 'Verify one and only one cashback transaction',
      pass: cashbackTx === 1,
      details: `cashbackTx=${cashbackTx}`,
    })

    const sourceOrder = await getOrder(noWalletOrder.id)
    const badgeCode = await verifyBadgeCodePresence()
    results.push({
      name: 'Verify list badge, detail badge, and source field in DB',
      pass: hasOrderSourceColumn && sourceOrder.order_source === 'offline_admin' && badgeCode.listHasOfflineBadge && badgeCode.detailHasOrderSource,
      details: hasOrderSourceColumn
        ? `order_source=${sourceOrder.order_source}, listBadge=${badgeCode.listHasOfflineBadge}, detailSource=${badgeCode.detailHasOrderSource}`
        : 'Blocked: order_source column not available in connected DB',
    })

    const otherTenantId = await getAnotherTenant(SENLYSH_TENANT_ID)
    if (!otherTenantId) {
      results.push({
        name: 'Verify tenant A cannot touch tenant B customer/product/order',
        pass: false,
        details: 'No secondary tenant fixture available',
      })
    } else {
      const otherFixture = await findTenantCustomerProduct(otherTenantId)
      if (otherFixture.customer && otherFixture.product) {
        const crossOrder = await createOrderWithItem({
          tenantId: otherTenantId,
          customerId: otherFixture.customer.id,
          product: otherFixture.product,
          status: 'pending',
          walletUsedCents: 0,
        })

        const crossMark = await api(`/api/admin/orders/${crossOrder.id}/mark-paid`, 'POST')
        const crossOrderAfter = await getOrder(crossOrder.id)

        results.push({
          name: 'Verify tenant A cannot touch tenant B customer/product/order',
          pass: crossMark.status >= 400 && crossOrderAfter.status === 'pending',
          details: `api=${crossMark.status}, crossStatus=${crossOrderAfter.status}`,
        })
      } else {
        results.push({
          name: 'Verify tenant A cannot touch tenant B customer/product/order',
          pass: false,
          details: 'Could not find customer/product fixture in secondary tenant',
        })
      }
    }

    const renameOrder = await createOrderWithItem({
      tenantId: SENLYSH_TENANT_ID,
      customerId: fixture.customer.id,
      product: fixture.product,
      status: 'pending',
      walletUsedCents: 0,
    })

    const originalName = fixture.product.name
    const renamed = `${originalName} [RENAMED_TEST]`

    const { error: renameError } = await supabase
      .from('products')
      .update({ name: renamed })
      .eq('id', fixture.product.id)
      .eq('tenant_id', SENLYSH_TENANT_ID)

    if (renameError) throw new Error(`Rename product failed: ${renameError.message}`)

    const { data: orderItemAfterRename, error: orderItemError } = await supabase
      .from('order_items')
      .select('id, products(name)')
      .eq('order_id', renameOrder.id)
      .limit(1)
      .single()

    await supabase
      .from('products')
      .update({ name: originalName })
      .eq('id', fixture.product.id)
      .eq('tenant_id', SENLYSH_TENANT_ID)

    if (orderItemError) throw new Error(`Order item read failed: ${orderItemError.message}`)

    const shownName = orderItemAfterRename?.products?.name || null
    results.push({
      name: 'Rename a product after order creation and inspect historic order display',
      pass: shownName === renamed,
      details: `displayedName=${shownName}`,
    })

    console.log('\n=== OFFLINE ADMIN ORDER TEST RESULTS ===\n')
    for (const r of results) {
      console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.details ? ` | ${r.details}` : ''}`)
    }

    const passed = results.filter(r => r.pass).length
    console.log(`\nSummary: ${passed}/${results.length} passed`)

    const failed = results.filter(r => !r.pass)
    if (failed.length > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Test harness failed:', error)
    process.exitCode = 1
  } finally {
    await cleanup()
  }
}

run()
