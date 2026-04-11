import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockState = {
  orderSource: 'offline_admin' | 'online'
  orderTotalCents: number
  processedReturnRefundedCents: number
  existingCancellationCreditedCents: number
  simulateInsertUniqueConflict: boolean
  insertedWalletCredits: any[]
}

const state: MockState = {
  orderSource: 'offline_admin',
  orderTotalCents: 2000,
  processedReturnRefundedCents: 0,
  existingCancellationCreditedCents: 0,
  simulateInsertUniqueConflict: false,
  insertedWalletCredits: [],
}

function makeRowsForAmount(total: number) {
  if (total <= 0) return []
  return [{ amount_cents: total }]
}

function mockQueryResult(table: string, op: 'select' | 'insert', filters: Record<string, unknown>, insertPayload?: any) {
  if (table === 'orders' && op === 'select') {
    return {
      data: {
        id: String(filters.id || 'order-id'),
        tenant_id: String(filters.tenant_id || 'tenant-id'),
        customer_id: 'customer-1',
        order_number: 'OFF-TEST-001',
        order_source: state.orderSource,
        total_cents: state.orderTotalCents,
      },
      error: null,
    }
  }

  if (table === 'order_returns' && op === 'select') {
    return {
      data: makeRowsForAmount(state.processedReturnRefundedCents).map((r) => ({ total_return_cents: r.amount_cents })),
      error: null,
    }
  }

  if (table === 'wallet_ledger' && op === 'select') {
    if (filters.source_key === 'OFFLINE_ORDER_CANCELLATION_REFUND') {
      return {
        data: makeRowsForAmount(state.existingCancellationCreditedCents),
        error: null,
      }
    }

    return { data: [], error: null }
  }

  if (table === 'wallet_ledger' && op === 'insert') {
    if (state.simulateInsertUniqueConflict) {
      return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
    }

    state.insertedWalletCredits.push(insertPayload)
    return { error: null }
  }

  return { data: null, error: null }
}

function makeMockSupabaseAdmin() {
  return {
    from: vi.fn((table: string) => {
      const filters: Record<string, unknown> = {}
      let op: 'select' | 'insert' = 'select'
      let insertPayload: any = null

      const query: any = {
        select: vi.fn(() => {
          op = 'select'
          return query
        }),
        eq: vi.fn((key: string, value: unknown) => {
          filters[key] = value
          return query
        }),
        single: vi.fn(async () => {
          return mockQueryResult(table, op, filters, insertPayload)
        }),
        insert: vi.fn((payload: any) => {
          op = 'insert'
          insertPayload = payload
          return query
        }),
        then: (resolve: any, reject: any) => {
          return Promise.resolve(mockQueryResult(table, op, filters, insertPayload)).then(resolve, reject)
        },
      }

      return query
    }),
  }
}

vi.mock('@/server/supabaseAdmin', () => ({
  supabaseAdmin: makeMockSupabaseAdmin(),
}))

vi.mock('@/lib/cashback/cashbackService', () => ({
  getWalletAccountId: vi.fn(async () => 'wallet-account-1'),
}))

import { processOfflineCancellationWalletRefund } from './offlineOrderCancellation'

describe('processOfflineCancellationWalletRefund', () => {
  beforeEach(() => {
    state.orderSource = 'offline_admin'
    state.orderTotalCents = 2000
    state.processedReturnRefundedCents = 0
    state.existingCancellationCreditedCents = 0
    state.simulateInsertUniqueConflict = false
    state.insertedWalletCredits = []
  })

  it('credits remaining refundable amount to wallet on offline cancellation', async () => {
    state.processedReturnRefundedCents = 1000

    const result = await processOfflineCancellationWalletRefund({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      reason: 'Admin cancellation approval',
    })

    expect(result.applied).toBe(true)
    expect(result.creditedCents).toBe(1000)
    expect(state.insertedWalletCredits).toHaveLength(1)
    expect(state.insertedWalletCredits[0].source_key).toBe('OFFLINE_ORDER_CANCELLATION_REFUND')
    expect(state.insertedWalletCredits[0].amount_cents).toBe(1000)
    expect(state.insertedWalletCredits[0].reference_id).toBe('order-1')
  })

  it('skips duplicate cancellation refund when already fully credited', async () => {
    state.existingCancellationCreditedCents = 2000

    const result = await processOfflineCancellationWalletRefund({
      tenantId: 'tenant-1',
      orderId: 'order-1',
    })

    expect(result.applied).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('already_refunded')
    expect(state.insertedWalletCredits).toHaveLength(0)
  })

  it('does not apply this rule for online orders', async () => {
    state.orderSource = 'online'

    const result = await processOfflineCancellationWalletRefund({
      tenantId: 'tenant-1',
      orderId: 'order-1',
    })

    expect(result.applied).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('not_offline_order')
    expect(state.insertedWalletCredits).toHaveLength(0)
  })

  it('treats wallet ledger unique-conflict as idempotent skip', async () => {
    state.simulateInsertUniqueConflict = true

    const result = await processOfflineCancellationWalletRefund({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      reason: 'Concurrent duplicate cancellation',
    })

    expect(result.applied).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('already_refunded')
  })
})
