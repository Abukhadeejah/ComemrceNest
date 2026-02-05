import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getAuthenticatedUserId } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { previewCashback } from '@/lib/cashback/cashbackService'

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      totalSalePriceCents,
      totalPurchasePriceCents,
      walletUsedCents = 0,
      cashPaidCents
    } = body

    // Preview cashback
    const preview = await previewCashback(
      customer.id,
      tenantId,
      totalSalePriceCents,
      totalPurchasePriceCents,
      walletUsedCents,
      cashPaidCents
    )

    return NextResponse.json({
      eligible: preview.eligible,
      reason: preview.reason,
      profitPct: preview.profitPct,
      cashbackPct: preview.cashbackPct,
      cashbackAmount: preview.cashbackAmount,
      cashbackRupees: preview.cashbackAmount / 100
    })

  } catch (error) {
    console.error('Cashback preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}