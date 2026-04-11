import { describe, expect, it } from 'vitest'
import {
  assertRequestedReturnQuantityWithinRemaining,
  assertValidBulkDeleteProductIds,
  assertWalletUsageWithinCap,
  computeOfflineWalletRefundSplit,
  computeRemainingOrderRefundableCents,
  computeRemainingReturnableQuantity,
  computeWalletUsageCap,
  isWithinReturnEditWindow,
} from './orderSafetyRules'

describe('Bulk Delete Safety Rules', () => {
  it('accepts valid UUID-like product ids', () => {
    const ids = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ]

    expect(() => assertValidBulkDeleteProductIds(ids)).not.toThrow()
  })

  it('rejects empty list', () => {
    expect(() => assertValidBulkDeleteProductIds([])).toThrow('No product IDs provided for bulk delete')
  })

  it('rejects malformed id', () => {
    expect(() => assertValidBulkDeleteProductIds(['bad-id'])).toThrow('Invalid product ID format in bulk delete request')
  })
})

describe('Wallet Cap Rules', () => {
  it('computes wallet cap as min(total, balance)', () => {
    expect(computeWalletUsageCap(10000, 5000)).toBe(5000)
    expect(computeWalletUsageCap(10000, 25000)).toBe(10000)
  })

  it('passes when requested wallet is within cap', () => {
    expect(() => assertWalletUsageWithinCap(4000, 10000, 5000)).not.toThrow()
  })

  it('fails when requested wallet exceeds cap', () => {
    expect(() => assertWalletUsageWithinCap(6000, 10000, 5000)).toThrow('Wallet used cannot exceed cap')
  })
})

describe('Partial Return Rules', () => {
  it('treats orders within 5 days as editable', () => {
    const now = Date.parse('2026-04-11T00:00:00.000Z')
    const createdAt = '2026-04-08T00:00:00.000Z'

    expect(isWithinReturnEditWindow(createdAt, now, 5)).toBe(true)
  })

  it('treats orders older than 5 days as non-editable', () => {
    const now = Date.parse('2026-04-11T00:00:00.000Z')
    const createdAt = '2026-04-01T00:00:00.000Z'

    expect(isWithinReturnEditWindow(createdAt, now, 5)).toBe(false)
  })

  it('treats future created_at timestamps as non-editable', () => {
    const now = Date.parse('2026-04-11T00:00:00.000Z')
    const createdAt = '2026-04-12T00:00:00.000Z'

    expect(isWithinReturnEditWindow(createdAt, now, 5)).toBe(false)
  })

  it('computes remaining returnable quantity correctly', () => {
    expect(computeRemainingReturnableQuantity(5, 2)).toBe(3)
    expect(computeRemainingReturnableQuantity(5, 8)).toBe(0)
  })

  it('rejects return request beyond remaining quantity', () => {
    expect(() => assertRequestedReturnQuantityWithinRemaining(4, 5, 2)).toThrow(
      'Requested return quantity exceeds remaining quantity'
    )
  })

  it('allows return request within remaining quantity', () => {
    expect(() => assertRequestedReturnQuantityWithinRemaining(3, 5, 2)).not.toThrow()
  })

  it('offline partial return credits full returned amount to wallet (mixed payment example)', () => {
    const split = computeOfflineWalletRefundSplit(1000)
    expect(split.walletRefundCents).toBe(1000)
    expect(split.cashRefundCents).toBe(0)
  })

  it('offline full return credits full amount to wallet on mixed payment', () => {
    const split = computeOfflineWalletRefundSplit(2000)
    expect(split.walletRefundCents).toBe(2000)
    expect(split.cashRefundCents).toBe(0)
  })

  it('offline full return credits full amount to wallet with zero prior wallet use', () => {
    const split = computeOfflineWalletRefundSplit(2000)
    expect(split.walletRefundCents).toBe(2000)
    expect(split.cashRefundCents).toBe(0)
  })

  it('computes remaining refundable amount for cancellation after partial return', () => {
    // Total order 2000, partial return already refunded 1000, cancellation should refund 1000.
    expect(computeRemainingOrderRefundableCents(2000, 1000, 0)).toBe(1000)
  })

  it('duplicate cancellation trigger should have zero remaining refundable amount after prior cancellation credit', () => {
    // Total 2000, no returns, already cancellation credited 2000.
    expect(computeRemainingOrderRefundableCents(2000, 0, 2000)).toBe(0)
  })
})
