import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set(name, value, options) },
          remove(name: string, options: Record<string, unknown>) { cookieStore.set(name, '', { ...options, maxAge: 0 }) },
        },
      }
    )

    const { data: { user } } = await supabaseSSR.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    // Fetch coupons
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    return NextResponse.json({ coupons: coupons || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set(name, value, options) },
          remove(name: string, options: Record<string, unknown>) { cookieStore.set(name, '', { ...options, maxAge: 0 }) },
        },
      }
    )

    const { data: { user } } = await supabaseSSR.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant
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
      min_order_value_cents,
      valid_until,
      max_uses,
      uses_per_customer
    } = body

    // Basic validation
    if (!code || !discount_type || !discount_value || !valid_until) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if code already exists for this tenant
    const { data: existingCoupon } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('code', code.toUpperCase().trim())
      .maybeSingle()

    if (existingCoupon) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    // Prepare insert data
    const insertData: Record<string, unknown> = {
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      discount_type,
      discount_value: parseFloat(discount_value),
      valid_from: new Date().toISOString(),
      valid_until: new Date(valid_until + 'T23:59:59').toISOString(),
      uses_per_customer: uses_per_customer || 1,
      is_active: true
    }

    // Add optional fields
    if (description) insertData.description = description
    if (max_discount_cents) insertData.max_discount_cents = max_discount_cents
    if (min_order_value_cents) insertData.min_order_value_cents = min_order_value_cents
    if (max_uses) insertData.max_uses = max_uses

    // Create coupon
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert(insertData)
      .select('*')
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