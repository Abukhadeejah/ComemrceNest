import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(request: NextRequest) {
  try {
    // Use SSR client to read auth from cookies
    const cookieStore = await cookies()
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // Get current user
    const { data: { user } } = await supabaseSSR.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve tenant via middleware-provided context (header/cookie)
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    // Fetch coupons with wildcard selection to avoid schema cache issues
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch coupons',
        details: error
      }, { status: 500 })
    }

    // Calculate stats for each coupon (hardcoded for now since we removed join)
    const couponsWithStats = (coupons || []).map(coupon => {
      return {
        ...coupon,
        total_uses: 0,
        total_discount_given_cents: 0
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
    // Use SSR client to read auth from cookies
    const cookieStore = await cookies()
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // Get current user
    const { data: { user } } = await supabaseSSR.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve tenant via middleware-provided context (header/cookie)
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
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
    const { data: existingCoupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('code', code.toUpperCase())
      .single()

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    // Create coupon
    const insertData: Record<string, unknown> = {
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      discount_type,
      discount_value,
      valid_from,
      valid_until,
      uses_per_customer: uses_per_customer || 1,
      is_active: true
    }
    
    // Add optional fields only if provided
    if (description) insertData.description = description
    if (max_discount_cents) insertData.max_discount_cents = max_discount_cents
    if (min_order_value_cents && min_order_value_cents > 0) insertData.min_order_value_cents = min_order_value_cents
    if (max_uses) insertData.max_uses = max_uses
    
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to create coupon',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
