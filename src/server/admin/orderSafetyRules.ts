export function normalizePositiveInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.floor(value)
}

export function computeWalletUsageCap(totalCents: number, walletBalanceCents: number): number {
  const safeTotal = Math.max(0, Math.floor(totalCents || 0))
  const safeBalance = Math.max(0, Math.floor(walletBalanceCents || 0))
  return Math.min(safeTotal, safeBalance)
}

export function assertWalletUsageWithinCap(
  requestedWalletUsedCents: number,
  totalCents: number,
  walletBalanceCents: number
) {
  const requested = Math.max(0, Math.floor(requestedWalletUsedCents || 0))
  const cap = computeWalletUsageCap(totalCents, walletBalanceCents)

  if (requested > cap) {
    throw new Error(`Wallet used cannot exceed cap. Requested: ${requested}, Allowed: ${cap}`)
  }
}

export function isWithinReturnEditWindow(
  orderCreatedAt: string,
  nowEpochMs = Date.now(),
  allowedDays = 5
): boolean {
  const createdAtMs = new Date(orderCreatedAt).getTime()
  if (!Number.isFinite(createdAtMs)) return false
  if (createdAtMs > nowEpochMs) return false
  const windowMs = Math.max(1, allowedDays) * 24 * 60 * 60 * 1000
  return nowEpochMs - createdAtMs <= windowMs
}

export function computeRemainingReturnableQuantity(
  soldQty: number,
  alreadyReturnedQty: number
): number {
  const safeSold = Math.max(0, Math.floor(soldQty || 0))
  const safeReturned = Math.max(0, Math.floor(alreadyReturnedQty || 0))
  return Math.max(0, safeSold - Math.min(safeSold, safeReturned))
}

export function assertRequestedReturnQuantityWithinRemaining(
  requestedQty: number,
  soldQty: number,
  alreadyReturnedQty: number
) {
  const safeRequested = Math.max(0, Math.floor(requestedQty || 0))
  const remainingQty = computeRemainingReturnableQuantity(soldQty, alreadyReturnedQty)

  if (safeRequested <= 0) {
    throw new Error('Requested return quantity must be positive')
  }

  if (safeRequested > remainingQty) {
    throw new Error(`Requested return quantity exceeds remaining quantity. Requested: ${safeRequested}, Remaining: ${remainingQty}`)
  }
}

export function assertValidBulkDeleteProductIds(productIds: string[]) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('No product IDs provided for bulk delete')
  }

  for (const productId of productIds) {
    if (!productId || typeof productId !== 'string' || productId.length !== 36) {
      throw new Error('Invalid product ID format in bulk delete request')
    }
  }
}

export function computeOfflineWalletRefundSplit(refundableAmountCents: number): {
  walletRefundCents: number
  cashRefundCents: number
} {
  const safe = Math.max(0, Math.floor(refundableAmountCents || 0))
  return {
    walletRefundCents: safe,
    cashRefundCents: 0,
  }
}

export function computeRemainingOrderRefundableCents(
  orderTotalCents: number,
  alreadyRefundedFromReturnsCents: number,
  alreadyCreditedFromCancellationCents: number
): number {
  const total = Math.max(0, Math.floor(orderTotalCents || 0))
  const fromReturns = Math.max(0, Math.floor(alreadyRefundedFromReturnsCents || 0))
  const fromCancel = Math.max(0, Math.floor(alreadyCreditedFromCancellationCents || 0))
  return Math.max(0, total - fromReturns - fromCancel)
}