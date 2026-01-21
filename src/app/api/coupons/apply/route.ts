import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderValue } = body

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    if (!orderValue || orderValue <= 0) {
      return NextResponse.json({ error: 'Valid order value is required' }, { status: 400 })
    }

    // Get tenant
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    // Find coupon
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching coupon:', error)
      return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
    }

    if (!coupon) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid coupon code' 
      }, { status: 200 })
    }

    // Check if coupon is still valid (date)
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom || now > validUntil) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Coupon has expired' 
      }, { status: 200 })
    }

    // Check minimum order value
    const orderValueCents = Math.round(orderValue * 100)
    if (coupon.min_order_value_cents && orderValueCents < coupon.min_order_value_cents) {
      const minOrderValue = coupon.min_order_value_cents / 100
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order value of ₹${minOrderValue} required` 
      }, { status: 200 })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderValueCents * coupon.discount_value) / 100
      
      // Apply max discount limit if set
      if (coupon.max_discount_cents && discountAmount > coupon.max_discount_cents) {
        discountAmount = coupon.max_discount_cents
      }
    } else {
      // Fixed amount discount
      discountAmount = coupon.discount_value * 100 // Convert to cents
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValueCents)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      discount: {
        amount_cents: Math.round(discountAmount),
        amount_rupees: discountAmount / 100,
        formatted: `₹${(discountAmount / 100).toFixed(2)}`
      }
    })

  } catch (error) {
    console.error('Error in coupon validation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}