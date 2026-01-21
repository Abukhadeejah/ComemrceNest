import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderValue } = body

    if (!orderValue || orderValue <= 0) {
      return NextResponse.json({ error: 'Valid order value is required' }, { status: 400 })
    }

    // Get tenant
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    // Find all active coupons for this tenant
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .order('discount_value', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    // Filter coupons that are applicable (considering min order value)
    const orderValueCents = Math.round(orderValue * 100)
    const applicableCoupons = (coupons || []).filter(coupon => {
      // Check if order meets minimum value requirement
      return !coupon.min_order_value_cents || orderValueCents >= coupon.min_order_value_cents
    })

    // Also include coupons that are close to being applicable (for upselling)
    const nearlyApplicableCoupons = (coupons || []).filter(coupon => {
      if (!coupon.min_order_value_cents) return false
      const shortfall = coupon.min_order_value_cents - orderValueCents
      return shortfall > 0 && shortfall <= 50000 // Within ₹500 of qualifying
    })

    const allCoupons = [...applicableCoupons, ...nearlyApplicableCoupons]
    
    // Remove duplicates and limit to top 5
    const uniqueCoupons = allCoupons
      .filter((coupon, index, self) => self.findIndex(c => c.id === coupon.id) === index)
      .slice(0, 5)

    return NextResponse.json({ coupons: uniqueCoupons })

  } catch (error) {
    console.error('Error in available coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}