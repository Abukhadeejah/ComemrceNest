import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    const body = await request.json()
    const { coupon_code, order_total_cents, customer_id, tenant_id } = body

    if (!coupon_code || !order_total_cents || !customer_id || !tenant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use the database function to validate coupon
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_tenant_id: tenant_id,
      p_coupon_code: coupon_code,
      p_customer_id: customer_id,
      p_order_total_cents: order_total_cents
    })

    if (error) {
      console.error('Error validating coupon:', error)
      return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
    }

    // The function returns an array with one result
    const result = data && data.length > 0 ? data[0] : null

    if (!result || !result.is_valid) {
      return NextResponse.json({
        valid: false,
        error: result?.error_message || 'Invalid coupon'
      })
    }

    return NextResponse.json({
      valid: true,
      coupon_id: result.coupon_id,
      discount_amount_cents: result.discount_amount_cents,
      discount_type: result.discount_type,
      discount_value: result.discount_value
    })
  } catch (error) {
    console.error('Error in POST /api/coupons/validate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
