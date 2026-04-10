import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getWalletAccountId } from '@/lib/cashback/cashbackService'

const adminDb = supabaseAdmin as any

type ReturnEffectType = 'wallet_refund' | 'cash_refund' | 'stock_restock' | 'cashback_reversal'

export interface OfflineReturnItemInput {
  orderItemId: string
  returnedQuantity: number
  restockQuantity?: number
  reason?: string
}

export interface CreateOfflineReturnInput {
  items: OfflineReturnItemInput[]
  reason?: string
  notes?: string
  walletRefundCents?: number
  cashRefundCents?: number
  createdBy?: string
  clientRequestId?: string
}

interface OrderSnapshot {
  id: string
  tenant_id: string
  customer_id: string | null
  order_number: string
  order_source: string | null
  status: string
  total_cents: number
  wallet_used_cents: number | null
  cash_paid_cents: number | null
  cashback_amount_cents: number | null
}

interface ReturnHeaderSnapshot {
  id: string
  tenant_id: string
  order_id: string
  return_number: string
  status: string
  total_return_cents: number
  wallet_refund_cents: number
  cash_refund_cents: number
  cashback_reversal_cents: number
}

interface OrderItemSnapshot {
  id: string
  order_id: string
  tenant_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price_cents: number
  subtotal_cents: number
  products?: {
    id: string
    stock: number | null
    track_inventory: boolean | null
    has_variants: boolean | null
    name: string | null
  } | null
  product_variants?: {
    id: string
    name: string | null
    stock: number | null
    track_inventory: boolean | null
  } | null
}

interface ReturnLineRow {
  id: string
  order_item_id: string
  product_id: string
  variant_id: string | null
  returned_quantity: number
  restock_quantity: number
  unit_price_cents: number
  return_subtotal_cents: number
}

interface ReturnItemEffectInput {
  orderReturnItemId?: string
  orderItemId: string
  productId: string
  returnedQuantity: number
  restockQuantity: number
  unitPriceCents: number
  returnSubtotalCents: number
  trackInventory: boolean
  hasVariant: boolean
  productName: string
  variantId?: string | null
  variantName?: string | null
}

async function syncOfflineOrderStatusFromProcessedReturns(tenantId: string, orderId: string) {
  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, quantity')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)

  if (orderItemsError) {
    throw new Error(`Failed to load order items for status sync: ${orderItemsError.message}`)
  }

  const itemRows = (orderItems || []) as Array<{ id: string; quantity: number | null }>
  if (itemRows.length === 0) {
    throw new Error('Cannot sync return status because order has no items')
  }

  const soldQtyByItem = new Map(itemRows.map((row) => [row.id, Math.max(0, row.quantity || 0)]))
  const totalSoldQty = Array.from(soldQtyByItem.values()).reduce((sum, qty) => sum + qty, 0)

  const { data: processedReturns, error: processedReturnsError } = await adminDb
    .from('order_returns')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('status', 'processed')

  if (processedReturnsError) {
    throw new Error(`Failed to load processed returns for status sync: ${processedReturnsError.message}`)
  }

  const returnIds = (processedReturns || []).map((row: { id: string }) => row.id)
  let returnedQtyByItem = new Map<string, number>()

  if (returnIds.length > 0) {
    const { data: returnLines, error: returnLinesError } = await adminDb
      .from('order_return_items')
      .select('order_item_id, returned_quantity')
      .eq('tenant_id', tenantId)
      .in('order_return_id', returnIds)

    if (returnLinesError) {
      throw new Error(`Failed to load return lines for status sync: ${returnLinesError.message}`)
    }

    returnedQtyByItem = (returnLines || []).reduce((acc: Map<string, number>, row: { order_item_id: string; returned_quantity: number | null }) => {
      const prev = acc.get(row.order_item_id) || 0
      acc.set(row.order_item_id, prev + Math.max(0, row.returned_quantity || 0))
      return acc
    }, new Map<string, number>())
  }

  const totalReturnedQty = Array.from(soldQtyByItem.entries()).reduce((sum, [orderItemId, soldQty]) => {
    const returned = returnedQtyByItem.get(orderItemId) || 0
    return sum + Math.min(soldQty, returned)
  }, 0)

  const nextStatus = totalReturnedQty >= totalSoldQty ? 'returned' : 'partially_returned'

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: nextStatus })
    .eq('tenant_id', tenantId)
    .eq('id', orderId)

  if (updateError) {
    throw new Error(`Failed to sync order return status: ${updateError.message}`)
  }
}

function generateOfflineReturnNumber(tenantId: string): string {
  const tenantPrefix = tenantId.replace(/-/g, '').slice(0, 4).toUpperCase()
  const ts = Date.now().toString().slice(-8)
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')

  return `OFFRET-${tenantPrefix}-${ts}-${rand}`
}

function ensurePositiveInt(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`)
  }
  return value
}

let effectTrackingSchemaReady: boolean | null = null

async function assertEffectTrackingSchemaReady() {
  if (effectTrackingSchemaReady) return

  const { error } = await adminDb
    .from('order_return_effects')
    .select('id, applied_at, last_error')
    .limit(1)

  if (error) {
    throw new Error(
      `Return effects schema is not hardened (missing applied_at/last_error). Apply migrations before processing returns. ${error.message}`
    )
  }

  effectTrackingSchemaReady = true
}

async function recordReturnEffectOnce(params: {
  tenantId: string
  orderReturnId: string
  orderReturnItemId?: string | null
  effectType: ReturnEffectType
  referenceId?: string | null
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  const { tenantId, orderReturnId, orderReturnItemId, effectType, referenceId, metadata } = params

  const { error } = await adminDb.from('order_return_effects').insert({
    tenant_id: tenantId,
    order_return_id: orderReturnId,
    order_return_item_id: orderReturnItemId || null,
    effect_type: effectType,
    reference_id: referenceId || null,
    metadata: metadata || {},
  })

  if (!error) {
    return true
  }

  // Unique violation means effect was already recorded (idempotent skip)
  if (error.code === '23505') {
    return false
  }

  throw new Error(`Failed to record return effect (${effectType}): ${error.message}`)
}

async function claimReturnEffectWork(params: {
  tenantId: string
  orderReturnId: string
  orderReturnItemId?: string | null
  effectType: ReturnEffectType
  referenceId?: string | null
  metadata?: Record<string, unknown>
}): Promise<{ id: string; alreadyApplied: boolean }> {
  const { tenantId, orderReturnId, orderReturnItemId, effectType, referenceId, metadata } = params

  const baseInsertPayload = {
    tenant_id: tenantId,
    order_return_id: orderReturnId,
    order_return_item_id: orderReturnItemId || null,
    effect_type: effectType,
    reference_id: referenceId || null,
    metadata: metadata || {},
  }

  const { data: inserted, error: insertError } = await adminDb
    .from('order_return_effects')
    .insert({
      ...baseInsertPayload,
      applied_at: null,
      last_error: null,
    })
    .select('id, applied_at')
    .maybeSingle()

  if (!insertError && inserted) {
    return { id: inserted.id, alreadyApplied: false }
  }

  if (insertError?.code !== '23505') {
    throw new Error(`Failed to claim return effect (${effectType}): ${insertError?.message || 'Unknown error'}`)
  }

  let query = adminDb
    .from('order_return_effects')
    .select('id, applied_at')
    .eq('tenant_id', tenantId)
    .eq('order_return_id', orderReturnId)
    .eq('effect_type', effectType)

  if (orderReturnItemId) {
    query = query.eq('order_return_item_id', orderReturnItemId)
  } else {
    query = query.is('order_return_item_id', null)
  }

  const { data: existing, error: existingError } = await query.maybeSingle()

  if (existingError || !existing) {
    throw new Error(`Failed to fetch existing return effect (${effectType}): ${existingError?.message || 'Not found'}`)
  }

  return { id: existing.id, alreadyApplied: !!existing.applied_at }
}

async function markReturnEffectApplied(effectId: string) {
  const { error } = await adminDb
    .from('order_return_effects')
    .update({ applied_at: new Date().toISOString(), last_error: null })
    .eq('id', effectId)

  if (error) {
    throw new Error(`Failed to mark return effect applied: ${error.message}`)
  }
}

async function markReturnEffectError(effectId: string, message: string) {
  const { error } = await adminDb
    .from('order_return_effects')
    .update({ last_error: message.slice(0, 2000) })
    .eq('id', effectId)

  if (error) {
    throw new Error(`Failed to mark return effect error: ${error.message}`)
  }
}

async function creditWalletRefund(params: {
  tenantId: string
  customerId: string
  orderId: string
  orderReturnId: string
  amountCents: number
  returnNumber: string
}) {
  const { tenantId, customerId, orderId, orderReturnId, amountCents, returnNumber } = params
  if (amountCents <= 0) return

  const effect = await claimReturnEffectWork({
    tenantId,
    orderReturnId,
    effectType: 'wallet_refund',
    referenceId: orderId,
    metadata: {
      amount_cents: amountCents,
      customer_id: customerId,
      return_number: returnNumber,
    },
  })

  if (effect.alreadyApplied) return

  try {
    const accountId = await getWalletAccountId(customerId, tenantId)
    const { error } = await supabaseAdmin.from('wallet_ledger').insert({
      account_id: accountId,
      tenant_id: tenantId,
      entry_type: 'credit',
      amount_cents: amountCents,
      currency: 'INR',
      source_key: 'RETURN_REFUND',
      reference_id: orderReturnId,
      metadata: {
        description: 'Wallet refund from offline return',
        order_id: orderId,
        order_return_id: orderReturnId,
        return_number: returnNumber,
      },
    })

    if (error) {
      throw new Error(`Failed to credit wallet refund: ${error.message}`)
    }

    await markReturnEffectApplied(effect.id)
  } catch (error) {
    await markReturnEffectError(effect.id, error instanceof Error ? error.message : 'Unknown wallet refund error')
    throw error
  }
}

async function recordCashRefund(params: {
  tenantId: string
  orderId: string
  orderReturnId: string
  amountCents: number
  returnNumber: string
}) {
  const { tenantId, orderId, orderReturnId, amountCents, returnNumber } = params
  if (amountCents <= 0) return

  const effect = await claimReturnEffectWork({
    tenantId,
    orderReturnId,
    effectType: 'cash_refund',
    referenceId: orderId,
    metadata: {
      amount_cents: amountCents,
      return_number: returnNumber,
      mode: 'manual_cash_refund_recorded',
    },
  })

  if (effect.alreadyApplied) return
  await markReturnEffectApplied(effect.id)
}

async function restockInventoryForReturn(params: {
  tenantId: string
  orderReturnId: string
  orderId: string
  returnItems: Array<{
    orderReturnItemId?: string
    productId: string
    variantId?: string | null
    restockQuantity: number
    trackInventory: boolean
    hasVariant: boolean
    productName: string
    variantName?: string | null
  }>
}) {
  const { tenantId, orderReturnId, orderId, returnItems } = params

  for (const item of returnItems) {
    if (!item.trackInventory || item.restockQuantity <= 0) continue

    if (!item.orderReturnItemId) {
      throw new Error(`Missing return item id for restock on product ${item.productName}`)
    }

    if (item.hasVariant && !item.variantId) {
      throw new Error(`Variant-based item restock requires a recorded variant for product ${item.productName}`)
    }

    const effect = await claimReturnEffectWork({
      tenantId,
      orderReturnId,
      orderReturnItemId: item.orderReturnItemId,
      effectType: 'stock_restock',
      referenceId: item.variantId || item.productId,
      metadata: {
        product_id: item.productId,
        variant_id: item.variantId || null,
        restock_quantity: item.restockQuantity,
        order_id: orderId,
      },
    })

    if (effect.alreadyApplied) continue

    try {
      const restockRpcName = item.variantId ? 'increment_product_variant_stock_atomic' : 'increment_product_stock_atomic'
      const restockArgs = item.variantId
        ? {
            p_tenant_id: tenantId,
            p_variant_id: item.variantId,
            p_increment_by: item.restockQuantity,
          }
        : {
            p_tenant_id: tenantId,
            p_product_id: item.productId,
            p_increment_by: item.restockQuantity,
          }

      const { error: restockError } = await supabaseAdmin.rpc(restockRpcName, restockArgs)

      if (restockError) {
        throw new Error(`Failed to restock product ${item.productName}: ${restockError.message}`)
      }

      await markReturnEffectApplied(effect.id)
    } catch (error) {
      await markReturnEffectError(effect.id, error instanceof Error ? error.message : 'Unknown restock error')
      throw error
    }
  }
}

async function reverseCashbackIfNeeded(params: {
  tenantId: string
  orderId: string
  orderReturnId: string
  cashbackReversalCents: number
}) {
  const { tenantId, orderId, orderReturnId, cashbackReversalCents } = params
  if (cashbackReversalCents <= 0) return

  const effect = await claimReturnEffectWork({
    tenantId,
    orderReturnId,
    effectType: 'cashback_reversal',
    referenceId: orderId,
    metadata: {
      cashback_reversal_cents: cashbackReversalCents,
    },
  })

  if (effect.alreadyApplied) return

  try {
    // Keep cashback_transactions immutable; reverse by append-only wallet ledger debit.
    const { data: cashbackCreditRows, error: cashbackCreditError } = await supabaseAdmin
      .from('wallet_ledger')
      .select('amount_cents')
      .eq('tenant_id', tenantId)
      .eq('source_key', 'CASHBACK')
      .eq('reference_id', orderId)
      .eq('entry_type', 'credit')

    if (cashbackCreditError) {
      throw new Error(`Failed to load cashback credit rows: ${cashbackCreditError.message}`)
    }

    const creditedCashbackCents = (cashbackCreditRows || []).reduce(
      (sum: number, row: { amount_cents?: number }) => sum + (row.amount_cents || 0),
      0
    )

    const debitCents = Math.min(cashbackReversalCents, creditedCashbackCents)
    if (debitCents <= 0) {
      await markReturnEffectApplied(effect.id)
      return
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('customer_id')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .single()

    if (orderError || !order?.customer_id) {
      throw new Error(`Unable to identify customer for cashback wallet reversal: ${orderError?.message || 'Missing customer'}`)
    }

    const accountId = await getWalletAccountId(order.customer_id, tenantId)
    const { error: ledgerError } = await supabaseAdmin
      .from('wallet_ledger')
      .insert({
        account_id: accountId,
        tenant_id: tenantId,
        entry_type: 'debit',
        amount_cents: debitCents,
        currency: 'INR',
        source_key: 'CASHBACK_REVERSAL',
        reference_id: orderReturnId,
        metadata: {
          description: 'Cashback reversal from return',
          order_id: orderId,
          order_return_id: orderReturnId,
        },
      })

    if (ledgerError) {
      throw new Error(`Failed to record cashback wallet debit: ${ledgerError.message}`)
    }

    await markReturnEffectApplied(effect.id)
  } catch (error) {
    await markReturnEffectError(effect.id, error instanceof Error ? error.message : 'Unknown cashback reversal error')
    throw error
  }
}

async function fetchReturnPayload(tenantId: string, returnId: string) {
  const { data: header, error: headerError } = await adminDb
    .from('order_returns')
    .select('id, return_number, order_id, status, total_return_cents, wallet_refund_cents, cash_refund_cents, cashback_reversal_cents')
    .eq('tenant_id', tenantId)
    .eq('id', returnId)
    .single()

  if (headerError || !header) {
    throw new Error(`Failed to load existing return payload: ${headerError?.message || 'Unknown error'}`)
  }

  const { data: lines, error: linesError } = await adminDb
    .from('order_return_items')
    .select('id, order_item_id, product_id, variant_id, returned_quantity, restock_quantity, unit_price_cents, return_subtotal_cents')
    .eq('tenant_id', tenantId)
    .eq('order_return_id', returnId)
    .order('created_at', { ascending: true })

  if (linesError) {
    throw new Error(`Failed to load existing return lines: ${linesError.message}`)
  }

  return {
    return: {
      id: header.id,
      returnNumber: header.return_number,
      orderId: header.order_id,
      totalReturnCents: header.total_return_cents,
      walletRefundCents: header.wallet_refund_cents,
      cashRefundCents: header.cash_refund_cents,
      cashbackReversalCents: header.cashback_reversal_cents,
      status: header.status,
      replayed: true,
    },
    items: (lines || []).map((row: ReturnLineRow) => ({
      id: row.id,
      orderItemId: row.order_item_id,
      productId: row.product_id,
      variantId: row.variant_id,
      returnedQuantity: row.returned_quantity,
      restockQuantity: row.restock_quantity,
      unitPriceCents: row.unit_price_cents,
      returnSubtotalCents: row.return_subtotal_cents,
    })),
  }
}

function assertVariantRestockCanBeResolved(items: ReturnItemEffectInput[]) {
  for (const item of items) {
    if (item.restockQuantity > 0 && item.hasVariant && !item.variantId) {
      throw new Error(
        `Variant-based item restock requires a recorded variant for product ${item.productName}`
      )
    }
  }
}

async function applyReturnEffectsAndFinalize(params: {
  tenantId: string
  orderId: string
  orderSnapshot: OrderSnapshot
  returnHeader: {
    id: string
    returnNumber: string
    walletRefundCents: number
    cashRefundCents: number
    cashbackReversalCents: number
  }
  returnItems: ReturnItemEffectInput[]
}) {
  const { tenantId, orderId, orderSnapshot, returnHeader, returnItems } = params

  assertVariantRestockCanBeResolved(returnItems)

  if (returnHeader.walletRefundCents > 0 && !orderSnapshot.customer_id) {
    throw new Error('Cannot issue wallet refund because original order has no customer id')
  }

  if (returnHeader.walletRefundCents > 0 && orderSnapshot.customer_id) {
    await creditWalletRefund({
      tenantId,
      customerId: orderSnapshot.customer_id,
      orderId,
      orderReturnId: returnHeader.id,
      amountCents: returnHeader.walletRefundCents,
      returnNumber: returnHeader.returnNumber,
    })
  }

  await recordCashRefund({
    tenantId,
    orderId,
    orderReturnId: returnHeader.id,
    amountCents: returnHeader.cashRefundCents,
    returnNumber: returnHeader.returnNumber,
  })

  await restockInventoryForReturn({
    tenantId,
    orderReturnId: returnHeader.id,
    orderId,
    returnItems: returnItems.map((item) => ({
      orderReturnItemId: item.orderReturnItemId,
      productId: item.productId,
      restockQuantity: item.restockQuantity,
      trackInventory: item.trackInventory,
      hasVariant: item.hasVariant,
      productName: item.productName,
    })),
  })

  await reverseCashbackIfNeeded({
    tenantId,
    orderId,
    orderReturnId: returnHeader.id,
    cashbackReversalCents: returnHeader.cashbackReversalCents,
  })

  const { error: finalizeError } = await adminDb
    .from('order_returns')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', returnHeader.id)
    .eq('status', 'draft')

  if (finalizeError) {
    throw new Error(`Failed to finalize return header: ${finalizeError.message}`)
  }

  await syncOfflineOrderStatusFromProcessedReturns(tenantId, orderId)
}

async function resumeDraftReturnProcessing(params: {
  tenantId: string
  orderId: string
  orderSnapshot: OrderSnapshot
  returnHeader: ReturnHeaderSnapshot
}) {
  const { tenantId, orderId, orderSnapshot, returnHeader } = params

  const { data: existingLines, error: linesError } = await adminDb
    .from('order_return_items')
    .select('id, order_item_id, product_id, variant_id, returned_quantity, restock_quantity, unit_price_cents, return_subtotal_cents')
    .eq('tenant_id', tenantId)
    .eq('order_return_id', returnHeader.id)
    .order('created_at', { ascending: true })

  if (linesError) {
    throw new Error(`Failed to load return lines for resume: ${linesError.message}`)
  }

  const lineRows = (existingLines || []) as ReturnLineRow[]
  if (lineRows.length === 0) {
    throw new Error('Existing draft return has no line items and cannot be resumed safely')
  }

  const orderItemIds = Array.from(new Set(lineRows.map((row) => row.order_item_id)))
  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, tenant_id, order_id, product_id, variant_id, products(id, track_inventory, has_variants, name), product_variants(id, name, track_inventory)')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .in('id', orderItemIds)

  if (orderItemsError) {
    throw new Error(`Failed to load order items for resume: ${orderItemsError.message}`)
  }

  const orderItemMap = new Map((orderItems || []).map((row: any) => [row.id, row]))
  const effectItems: ReturnItemEffectInput[] = lineRows.map((row) => {
    const source: any = orderItemMap.get(row.order_item_id)
    if (!source) {
      throw new Error(`Return line references missing order item ${row.order_item_id}`)
    }

    return {
      orderReturnItemId: row.id,
      orderItemId: row.order_item_id,
      productId: row.product_id,
      variantId: row.variant_id || source.variant_id || null,
      returnedQuantity: row.returned_quantity,
      restockQuantity: row.restock_quantity,
      unitPriceCents: row.unit_price_cents,
      returnSubtotalCents: row.return_subtotal_cents,
      trackInventory: !!source.products?.track_inventory,
      hasVariant: !!source.products?.has_variants,
      productName: source.products?.name || row.product_id,
      variantName: source.product_variants?.name || null,
    }
  })

  await applyReturnEffectsAndFinalize({
    tenantId,
    orderId,
    orderSnapshot,
    returnHeader: {
      id: returnHeader.id,
      returnNumber: returnHeader.return_number,
      walletRefundCents: returnHeader.wallet_refund_cents,
      cashRefundCents: returnHeader.cash_refund_cents,
      cashbackReversalCents: returnHeader.cashback_reversal_cents,
    },
    returnItems: effectItems,
  })
}

export async function createOfflineOrderReturn(
  tenantId: string,
  orderId: string,
  input: CreateOfflineReturnInput
) {
  await assertEffectTrackingSchemaReady()

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('At least one return item is required')
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, tenant_id, customer_id, order_number, order_source, status, total_cents, wallet_used_cents, cash_paid_cents, cashback_amount_cents')
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Order not found in tenant scope: ${orderError?.message || 'Unknown error'}`)
  }

  const orderSnapshot = order as OrderSnapshot

  if (orderSnapshot.order_source !== 'offline_admin') {
    throw new Error('Returns are currently allowed only for offline_admin orders')
  }

  if (orderSnapshot.status === 'returned') {
    throw new Error('This order is already fully returned')
  }

  if (!['paid', 'fulfilled', 'partially_returned'].includes(orderSnapshot.status)) {
    throw new Error('Only paid, fulfilled, or partially returned offline orders can be returned')
  }

  const normalizedClientRequestId = input.clientRequestId?.trim() || null

  // Replay-safe idempotency lookup before any financial validation.
  if (normalizedClientRequestId) {
    const { data: existingHeader, error: existingHeaderError } = await adminDb
      .from('order_returns')
      .select('id, tenant_id, order_id, return_number, status, total_return_cents, wallet_refund_cents, cash_refund_cents, cashback_reversal_cents')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .eq('client_request_id', normalizedClientRequestId)
      .maybeSingle()

    if (existingHeaderError) {
      throw new Error(`Return idempotency precheck failed: ${existingHeaderError.message}`)
    }

    if (existingHeader?.id) {
      const existing = existingHeader as ReturnHeaderSnapshot
      if (existing.status === 'processed') {
        return await fetchReturnPayload(tenantId, existing.id)
      }

      if (existing.status !== 'draft') {
        throw new Error(`Cannot resume return in status ${existing.status}`)
      }

      await resumeDraftReturnProcessing({
        tenantId,
        orderId,
        orderSnapshot,
        returnHeader: existing,
      })

      return await fetchReturnPayload(tenantId, existing.id)
    }
  }

  const { data: existingProcessedReturn, error: existingProcessedReturnError } = await adminDb
    .from('order_returns')
    .select('id, return_number')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('status', 'processed')
    .limit(1)
    .maybeSingle()

  if (existingProcessedReturnError) {
    throw new Error(`Failed to verify existing processed returns: ${existingProcessedReturnError.message}`)
  }

  if (existingProcessedReturn?.id) {
    throw new Error(`Return already exists for this order (${existingProcessedReturn.return_number})`)
  }

  const normalizedItems = input.items.map((item, index) => ({
    orderItemId: item.orderItemId,
    returnedQuantity: ensurePositiveInt(Number(item.returnedQuantity), `items[${index}].returnedQuantity`),
    restockQuantity: Number(item.restockQuantity || 0),
    reason: item.reason?.trim() || null,
  }))

  for (let i = 0; i < normalizedItems.length; i += 1) {
    const item = normalizedItems[i]
    if (!item.orderItemId) {
      throw new Error(`items[${i}].orderItemId is required`)
    }
    if (!Number.isInteger(item.restockQuantity) || item.restockQuantity < 0) {
      throw new Error(`items[${i}].restockQuantity must be a non-negative integer`)
    }
    if (item.restockQuantity > item.returnedQuantity) {
      throw new Error(`items[${i}] restockQuantity cannot exceed returnedQuantity`)
    }
  }

  const orderItemIds = Array.from(new Set(normalizedItems.map((item) => item.orderItemId)))

  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('id, order_id, tenant_id, product_id, variant_id, quantity, unit_price_cents, subtotal_cents, products(id, stock, track_inventory, has_variants, name), product_variants(id, name, stock, track_inventory)')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .in('id', orderItemIds)

  if (orderItemsError) {
    throw new Error(`Failed to fetch order items for return: ${orderItemsError.message}`)
  }

  const orderItemMap = new Map((orderItems || []).map((item: OrderItemSnapshot) => [item.id, item]))
  for (const id of orderItemIds) {
    if (!orderItemMap.has(id)) {
      throw new Error(`Order item ${id} is not part of order ${orderSnapshot.order_number}`)
    }
  }

  const pricedReturnItems = normalizedItems.map((item) => {
    const source = orderItemMap.get(item.orderItemId) as OrderItemSnapshot
    const soldQty = source.quantity || 0

    if (item.returnedQuantity > soldQty) {
      throw new Error(`Return quantity exceeds sold quantity for order item ${item.orderItemId}`)
    }

    const unitPrice = source.unit_price_cents || 0
    return {
      ...item,
      productId: source.product_id,
      variantId: source.variant_id || null,
      unitPriceCents: unitPrice,
      returnSubtotalCents: unitPrice * item.returnedQuantity,
      trackInventory: !!source.products?.track_inventory,
      hasVariant: !!source.products?.has_variants,
      productName: source.products?.name || source.product_id,
      variantName: source.product_variants?.name || null,
    }
  })

  const totalReturnCents = pricedReturnItems.reduce((sum, item) => sum + item.returnSubtotalCents, 0)
  if (totalReturnCents <= 0) {
    throw new Error('Total return amount must be greater than zero')
  }

  assertVariantRestockCanBeResolved(pricedReturnItems)

  const maxWalletRefund = Math.min(orderSnapshot.wallet_used_cents || 0, totalReturnCents)
  const fallbackWalletRefund = maxWalletRefund
  const requestedWalletRefund = input.walletRefundCents
  const requestedCashRefund = input.cashRefundCents

  let walletRefundCents =
    typeof requestedWalletRefund === 'number' ? Math.max(0, Math.floor(requestedWalletRefund)) : fallbackWalletRefund

  let cashRefundCents =
    typeof requestedCashRefund === 'number'
      ? Math.max(0, Math.floor(requestedCashRefund))
      : Math.max(0, totalReturnCents - walletRefundCents)

  if (walletRefundCents + cashRefundCents !== totalReturnCents) {
    throw new Error('walletRefundCents + cashRefundCents must equal total return amount')
  }

  if (walletRefundCents > maxWalletRefund) {
    throw new Error('walletRefundCents cannot exceed wallet amount used in original order')
  }

  const { data: previousReturns, error: prevReturnError } = await adminDb
    .from('order_returns')
    .select('wallet_refund_cents, cash_refund_cents, cashback_reversal_cents')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .neq('status', 'cancelled')

  if (prevReturnError) {
    throw new Error(`Failed to compute previous cashback reversals: ${prevReturnError.message}`)
  }

  const alreadyRefundedWalletCents = (previousReturns || []).reduce(
    (sum: number, row: { wallet_refund_cents?: number }) => sum + (row.wallet_refund_cents || 0),
    0
  )

  const alreadyRefundedCashCents = (previousReturns || []).reduce(
    (sum: number, row: { cash_refund_cents?: number }) => sum + (row.cash_refund_cents || 0),
    0
  )

  const remainingWalletRefundableCents = Math.max(0, (orderSnapshot.wallet_used_cents || 0) - alreadyRefundedWalletCents)
  const remainingCashRefundableCents = Math.max(0, (orderSnapshot.cash_paid_cents || 0) - alreadyRefundedCashCents)

  if (walletRefundCents > remainingWalletRefundableCents) {
    throw new Error('walletRefundCents exceeds remaining refundable wallet amount for this order')
  }

  if (cashRefundCents > remainingCashRefundableCents) {
    throw new Error('cashRefundCents exceeds remaining refundable cash amount for this order')
  }

  const alreadyReversedCashbackCents = (previousReturns || []).reduce(
    (sum: number, row: { cashback_reversal_cents?: number }) => sum + (row.cashback_reversal_cents || 0),
    0
  )

  const orderCashbackCents = orderSnapshot.cashback_amount_cents || 0
  const remainingReversibleCashbackCents = Math.max(0, orderCashbackCents - alreadyReversedCashbackCents)

  const proportionalReversal = orderSnapshot.total_cents > 0
    ? Math.round((orderCashbackCents * totalReturnCents) / orderSnapshot.total_cents)
    : 0

  const cashbackReversalCents = Math.min(remainingReversibleCashbackCents, Math.max(0, proportionalReversal))

  const returnNumber = generateOfflineReturnNumber(tenantId)

  const { data: returnHeader, error: returnHeaderError } = await adminDb
    .from('order_returns')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      customer_id: orderSnapshot.customer_id,
      return_number: returnNumber,
      status: 'draft',
      reason: input.reason?.trim() || null,
      notes: input.notes?.trim() || null,
      total_return_cents: totalReturnCents,
      wallet_refund_cents: walletRefundCents,
      cash_refund_cents: cashRefundCents,
      cashback_reversal_cents: cashbackReversalCents,
      created_by: input.createdBy?.trim() || null,
      client_request_id: normalizedClientRequestId,
    })
    .select('id, return_number')
    .single()

  if (returnHeaderError || !returnHeader) {
    if (returnHeaderError?.code === '23505' && normalizedClientRequestId) {
      const { data: existingHeader, error: existingHeaderError } = await adminDb
        .from('order_returns')
        .select('id, tenant_id, order_id, return_number, status, total_return_cents, wallet_refund_cents, cash_refund_cents, cashback_reversal_cents')
        .eq('tenant_id', tenantId)
        .eq('order_id', orderId)
        .eq('client_request_id', normalizedClientRequestId)
        .maybeSingle()

      if (existingHeaderError) {
        throw new Error(`Return idempotency lookup failed: ${existingHeaderError.message}`)
      }

      if (existingHeader?.id) {
        const existing = existingHeader as ReturnHeaderSnapshot

        if (existing.status === 'processed') {
          return await fetchReturnPayload(tenantId, existing.id)
        }

        if (existing.status !== 'draft') {
          throw new Error(`Cannot resume return in status ${existing.status}`)
        }

        await resumeDraftReturnProcessing({
          tenantId,
          orderId,
          orderSnapshot,
          returnHeader: existing,
        })

        return await fetchReturnPayload(tenantId, existing.id)
      }
    }

    throw new Error(`Failed to create return header: ${returnHeaderError?.message || 'Unknown error'}`)
  }

  const { data: returnLineRows, error: returnLinesError } = await adminDb
    .from('order_return_items')
    .insert(
      pricedReturnItems.map((item) => ({
        tenant_id: tenantId,
        order_return_id: returnHeader.id,
        order_item_id: item.orderItemId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        variant_name: item.variantName || null,
        returned_quantity: item.returnedQuantity,
        restock_quantity: item.restockQuantity,
        unit_price_cents: item.unitPriceCents,
        return_subtotal_cents: item.returnSubtotalCents,
        reason: item.reason,
      }))
    )
    .select('id, order_item_id, product_id, variant_id, returned_quantity, restock_quantity, unit_price_cents, return_subtotal_cents')

  if (returnLinesError || !returnLineRows) {
    throw new Error(`Failed to create return line items: ${returnLinesError?.message || 'Unknown error'}`)
  }

  const byOrderItem = new Map((returnLineRows as ReturnLineRow[]).map((row) => [row.order_item_id, row]))

  await applyReturnEffectsAndFinalize({
    tenantId,
    orderId,
    orderSnapshot,
    returnHeader: {
      id: returnHeader.id,
      returnNumber,
      walletRefundCents,
      cashRefundCents,
      cashbackReversalCents,
    },
    returnItems: pricedReturnItems.map((item) => ({
      orderReturnItemId: byOrderItem.get(item.orderItemId)?.id,
      orderItemId: item.orderItemId,
      productId: item.productId,
      variantId: item.variantId || null,
      returnedQuantity: item.returnedQuantity,
      restockQuantity: item.restockQuantity,
      unitPriceCents: item.unitPriceCents,
      returnSubtotalCents: item.returnSubtotalCents,
      trackInventory: item.trackInventory,
      hasVariant: item.hasVariant,
      productName: item.productName,
      variantName: item.variantName,
    })),
  })

  return {
    return: {
      id: returnHeader.id,
      returnNumber: returnHeader.return_number,
      orderId,
      totalReturnCents,
      walletRefundCents,
      cashRefundCents,
      cashbackReversalCents,
      status: 'processed' as const,
    },
    items: (returnLineRows as ReturnLineRow[]).map((row) => ({
      id: row.id,
      orderItemId: row.order_item_id,
      productId: row.product_id,
      returnedQuantity: row.returned_quantity,
      restockQuantity: row.restock_quantity,
      unitPriceCents: row.unit_price_cents,
      returnSubtotalCents: row.return_subtotal_cents,
    })),
  }
}
