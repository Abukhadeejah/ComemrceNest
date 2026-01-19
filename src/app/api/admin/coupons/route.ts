import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant_id from user metadata or profile
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Fetch coupons with usage stats
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_usage (
          id,
          discount_amount_cents
        )
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    // Calculate stats for each coupon
    const couponsWithStats = coupons.map(coupon => {
      const usageArray = Array.isArray(coupon.coupon_usage) ? coupon.coupon_usage : []
      return {
        ...coupon,
        total_uses: usageArray.length,
        total_discount_given_cents: usageArray.reduce((sum: number, usage: any) => 
          sum + (usage.discount_amount_cents || 0), 0
        ),
        coupon_usage: undefined // Remove the raw usage data
      }
    })

    return NextResponse.json({ coupons: couponsWithStats })
  } catch (error) {
    console.error('Error in GET /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant_id from user metadata or profile
    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_discount_cents,
      valid_from,
      valid_until,
      min_order_value_cents,
      max_uses,
      uses_per_customer
    } = body

    // Validation
    if (!code || !discount_type || !discount_value || !valid_from || !valid_until) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (discount_type !== 'percentage' && discount_type !== 'fixed') {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
    }

    if (discount_value <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 })
    }

    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 })
    }

    // Check if code already exists for this tenant
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('code', code.toUpperCase())
      .single()

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    // Create coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        tenant_id: profile.tenant_id,
        code: code.toUpperCase().trim(),
        description,
        discount_type,
        discount_value,
        max_discount_cents: max_discount_cents || null,
        valid_from,
        valid_until,
        min_order_value_cents: min_order_value_cents || 0,
        max_uses: max_uses || null,
        uses_per_customer: uses_per_customer || 1,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
