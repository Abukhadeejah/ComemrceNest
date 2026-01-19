/**
 * CASHBACK PREVIEW API
 * 
 * POST /api/wallet/preview-cashback - Preview cashback before order
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { previewCashback } from '@/lib/cashback/cashbackService'

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    const {
      customerId,
      totalSalePriceCents,
      totalPurchasePriceCents,
      walletUsedCents,
      cashPaidCents
    } = body
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    // Preview cashback
    const preview = await previewCashback(
      customerId,
      tenantId,
      totalSalePriceCents,
      totalPurchasePriceCents,
      walletUsedCents,
      cashPaidCents
    )
    
    return NextResponse.json(preview)
    
  } catch (error: any) {
    console.error('[POST /api/wallet/preview-cashback] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to preview cashback', message: error.message },
      { status: 500 }
    )
  }
}
