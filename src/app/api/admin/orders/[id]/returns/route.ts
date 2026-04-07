import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { revalidateTag } from 'next/cache'
import { tenantOrdersTag, tenantProductsTag } from '@/server/cacheTags'
import { createOfflineOrderReturn, type CreateOfflineReturnInput } from '@/server/admin/offlineOrderReturns'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params

    const tenantId = await resolveTenantIdFromRequest()

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant resolution required for return operations' }, { status: 400 })
    }

    if (!orderId || typeof orderId !== 'string' || orderId.length !== 36) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 })
    }

    const body = (await request.json()) as CreateOfflineReturnInput
    const result = await createOfflineOrderReturn(tenantId, orderId, body)

    // Also bust shared orders list cache used by server actions.
    revalidateTag('orders', 'default')
    revalidateTag(tenantOrdersTag(tenantId), 'default')
    revalidateTag(tenantProductsTag(tenantId), 'default')

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create offline return',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
