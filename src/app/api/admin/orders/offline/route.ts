import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { createOfflineOrder, type CreateOfflineOrderInput } from '@/server/admin/offlineOrders'

export async function POST(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const body = (await request.json()) as CreateOfflineOrderInput
    const result = await createOfflineOrder(tenantId, body)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create offline order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
