import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getWalletAccountId } from '@/lib/cashback/cashbackService'
import { computeRemainingOrderRefundableCents } from './orderSafetyRules'

type OfflineOrderSnapshot = {
  id: string
  tenant_id: string
  customer_id: string | null
  order_number: string
  order_source: string | null
  total_cents: number
}

async function getExistingOfflineCancellationWalletCredits(tenantId: string, orderId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('wallet_ledger')
    .select('amount_cents')
    .eq('tenant_id', tenantId)
    .eq('entry_type', 'credit')
    .eq('source_key', 'OFFLINE_ORDER_CANCELLATION_REFUND')
    .eq('reference_id', orderId)

  if (error) {
    throw new Error(`Failed to load existing cancellation wallet credits: ${error.message}`)
  }

  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0)
}

async function getAlreadyRefundedFromProcessedReturns(tenantId: string, orderId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('order_returns')
    .select('total_return_cents')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('status', 'processed')

  if (error) {
    throw new Error(`Failed to load processed return totals for cancellation refund: ${error.message}`)
  }

  return (data || []).reduce((sum, row) => sum + (row.total_return_cents || 0), 0)
}

export async function processOfflineCancellationWalletRefund(params: {
  tenantId: string
  orderId: string
  reason?: string
}) {
  const { tenantId, orderId, reason } = params

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, tenant_id, customer_id, order_number, order_source, total_cents')
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Failed to load order for offline cancellation refund: ${orderError?.message || 'Order not found'}`)
  }

  const snapshot = order as OfflineOrderSnapshot

  if (snapshot.order_source !== 'offline_admin') {
    return {
      applied: false,
      skipped: true,
      reason: 'not_offline_order' as const,
      creditedCents: 0,
      remainingRefundableCents: 0,
    }
  }

  if (!snapshot.customer_id) {
    throw new Error('Offline cancellation refund requires a customer id on the order')
  }

  const [alreadyRefundedFromReturns, alreadyCreditedFromCancellation] = await Promise.all([
    getAlreadyRefundedFromProcessedReturns(tenantId, orderId),
    getExistingOfflineCancellationWalletCredits(tenantId, orderId),
  ])

  const remainingRefundableCents = computeRemainingOrderRefundableCents(
    snapshot.total_cents || 0,
    alreadyRefundedFromReturns,
    alreadyCreditedFromCancellation
  )

  if (remainingRefundableCents <= 0) {
    return {
      applied: false,
      skipped: true,
      reason: 'already_refunded' as const,
      creditedCents: 0,
      remainingRefundableCents: 0,
    }
  }

  const accountId = await getWalletAccountId(snapshot.customer_id, tenantId)

  const { error: insertError } = await supabaseAdmin
    .from('wallet_ledger')
    .insert({
      account_id: accountId,
      tenant_id: tenantId,
      entry_type: 'credit',
      amount_cents: remainingRefundableCents,
      currency: 'INR',
      source_key: 'OFFLINE_ORDER_CANCELLATION_REFUND',
      reference_id: orderId,
      metadata: {
        description: 'Offline order cancellation refund credited to wallet',
        order_id: orderId,
        order_number: snapshot.order_number,
        reason: reason || 'Order cancelled by admin',
        already_refunded_from_returns_cents: alreadyRefundedFromReturns,
        already_credited_from_cancellation_cents: alreadyCreditedFromCancellation,
      },
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        applied: false,
        skipped: true,
        reason: 'already_refunded' as const,
        creditedCents: 0,
        remainingRefundableCents: 0,
      }
    }

    throw new Error(`Failed to insert offline cancellation wallet refund: ${insertError.message}`)
  }

  return {
    applied: true,
    skipped: false,
    reason: 'wallet_credited' as const,
    creditedCents: remainingRefundableCents,
    remainingRefundableCents: 0,
  }
}