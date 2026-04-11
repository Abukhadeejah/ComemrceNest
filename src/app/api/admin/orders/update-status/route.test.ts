import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  revalidateTagMock,
  resolveTenantIdFromRequestMock,
  processPaidOrderPostPaymentOnceMock,
  processOfflineCancellationWalletRefundMock,
  state,
  supabaseAdminMock,
} = vi.hoisted(() => {
  const state = {
    currentOrderError: null as { message: string } | null,
    currentOrderStatus: 'paid',
    currentOrderSource: 'offline_admin',
    updateError: null as { code?: string; message: string } | null,
  }

  function makeOrderSelectQuery() {
    return {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => {
        if (state.currentOrderError) {
          return { data: null, error: state.currentOrderError }
        }

        return {
          data: {
            status: state.currentOrderStatus,
            order_source: state.currentOrderSource,
          },
          error: null,
        }
      }),
    }
  }

  function makeOrderUpdateQuery() {
    return {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => {
        if (state.updateError) {
          return { data: null, error: state.updateError }
        }

        return {
          data: { id: 'order-1', order_number: 'OFF-001', status: 'cancelled' },
          error: null,
        }
      }),
    }
  }

  const supabaseAdminMock = {
    from: vi.fn((table: string) => {
      if (table !== 'orders') {
        throw new Error(`Unexpected table in test: ${table}`)
      }

      return {
        select: vi.fn(() => makeOrderSelectQuery()),
        update: vi.fn(() => makeOrderUpdateQuery()),
      }
    }),
  }

  return {
    revalidateTagMock: vi.fn(),
    resolveTenantIdFromRequestMock: vi.fn(async () => 'tenant-1'),
    processPaidOrderPostPaymentOnceMock: vi.fn(async () => ({ processed: true })),
    processOfflineCancellationWalletRefundMock: vi.fn(async () => ({ applied: true })),
    state,
    supabaseAdminMock,
  }
})

vi.mock('@/server/tenant', () => ({
  resolveTenantIdFromRequest: resolveTenantIdFromRequestMock,
}))

vi.mock('@/server/supabaseAdmin', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
}))

vi.mock('@/server/cacheTags', () => ({
  tenantOrdersTag: vi.fn(() => 'tenant-orders-tag'),
}))

vi.mock('@/server/admin/offlineOrders', () => ({
  processPaidOrderPostPaymentOnce: processPaidOrderPostPaymentOnceMock,
}))

vi.mock('@/server/admin/offlineOrderCancellation', () => ({
  processOfflineCancellationWalletRefund: processOfflineCancellationWalletRefundMock,
}))

import { PATCH } from './route'

describe('PATCH /api/admin/orders/update-status', () => {
  beforeEach(() => {
    state.currentOrderError = null
    state.currentOrderStatus = 'paid'
    state.currentOrderSource = 'offline_admin'
    state.updateError = null

    resolveTenantIdFromRequestMock.mockClear()
    processPaidOrderPostPaymentOnceMock.mockClear()
    processOfflineCancellationWalletRefundMock.mockClear()
    revalidateTagMock.mockClear()
  })

  it('returns 404 when order cannot be loaded in tenant scope', async () => {
    state.currentOrderError = { message: 'No rows' }

    const request = new Request('http://localhost/api/admin/orders/update-status', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: '11111111-1111-1111-1111-111111111111', status: 'cancelled' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await PATCH(request as any)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Order not found or access denied')
    expect(processOfflineCancellationWalletRefundMock).not.toHaveBeenCalled()
  })

  it('no-ops cleanly when already cancelled', async () => {
    state.currentOrderStatus = 'cancelled'

    const request = new Request('http://localhost/api/admin/orders/update-status', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: '11111111-1111-1111-1111-111111111111', status: 'cancelled' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await PATCH(request as any)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(String(json.message || '')).toContain('already cancelled')
    expect(processOfflineCancellationWalletRefundMock).not.toHaveBeenCalled()
  })

  it('calls offline cancellation refund for offline orders when transitioning to cancelled', async () => {
    state.currentOrderStatus = 'paid'
    state.currentOrderSource = 'offline_admin'

    const request = new Request('http://localhost/api/admin/orders/update-status', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: '11111111-1111-1111-1111-111111111111', status: 'cancelled' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await PATCH(request as any)

    expect(response.status).toBe(200)
    expect(processOfflineCancellationWalletRefundMock).toHaveBeenCalledTimes(1)
    expect(processOfflineCancellationWalletRefundMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      orderId: '11111111-1111-1111-1111-111111111111',
      reason: 'Order cancelled via admin status update',
    })
  })
})
