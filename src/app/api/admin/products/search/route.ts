import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { searchSelectableProducts } from '@/server/admin/offlineOrders'

export async function GET(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const q = request.nextUrl.searchParams.get('q') || ''
    const limit = Number(request.nextUrl.searchParams.get('limit') || '20')

    if (!q.trim()) {
      return NextResponse.json({ success: true, products: [] })
    }

    const products = await searchSelectableProducts(tenantId, q, limit)

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to search products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
