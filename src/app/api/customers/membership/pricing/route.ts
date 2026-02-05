import { NextRequest, NextResponse } from 'next/server'
import { getMembershipPricing } from '@/lib/membership/membershipService'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const pricing = await getMembershipPricing(tenantId)

    return NextResponse.json({
      success: true,
      pricing
    })

  } catch (error) {
    console.error('[GET /api/customers/membership/pricing] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}