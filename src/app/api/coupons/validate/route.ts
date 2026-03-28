import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest, resolveTenantIdFromKey } from '@/server/tenant'

export async function POST(request: NextRequest) {
  try {
    // Debug: Log all cookies (remove after prod fix)
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => c.name.includes('sb-'))
    console.log('Coupon validate: totalCookies', allCookies.length, 'authCookies', authCookies.length)

    // Create SSR Supabase client FIRST for auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // CRITICAL: Auth check before anything else
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Coupon validate: hasUser', !!user, 'userId', user?.id, 'authError', authError?.message)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised - no session' }, { status: 401 })
    }

    const body = await request.json()
    const { coupon_code, order_total_cents, customer_id, tenant_key } = body

    if (!coupon_code || !order_total_cents || !customer_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve tenant (your existing helpers)
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId && tenant_key) {
      tenantId = await resolveTenantIdFromKey(tenant_key)
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    console.log('Coupon validate: tenantId', tenantId, 'coupon_code', coupon_code)

    // Use supabaseAdmin for RPC (service role bypasses RLS)
    const { data, error } = await supabaseAdmin.rpc('validate_coupon', {
      p_tenant_id: tenantId,
      p_coupon_code: coupon_code,
      p_customer_id: customer_id,
      p_order_total_cents: order_total_cents
    })

    if (error) {
      console.error('Coupon RPC error:', error)
      return NextResponse.json({ 
        error: 'Failed to validate coupon', 
        details: error.message || error.hint || null 
      }, { status: 500 })
    }

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
    console.error('Coupon validate fatal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
