import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching coupon:', error)
      return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in GET /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const {
      // editable fields
      code,
      description,
      discount_type,
      discount_value,
      max_discount_cents,
      valid_from,
      valid_until,
      min_order_value_cents,
      max_uses,
      uses_per_customer,
      is_active
    } = body

    // Update coupon
    // Resolve tenant via middleware-provided context (header/cookie)
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    // Validate if changing code or values
    const updateData: Record<string, unknown> = {}
    if (typeof is_active === 'boolean') updateData.is_active = is_active
    if (code) updateData.code = String(code).toUpperCase().trim()
    if (description !== undefined) updateData.description = description
    if (discount_type) updateData.discount_type = discount_type
    if (typeof discount_value === 'number') updateData.discount_value = discount_value
    if (max_discount_cents !== undefined) updateData.max_discount_cents = max_discount_cents
    if (valid_from) updateData.valid_from = valid_from
    if (valid_until) updateData.valid_until = valid_until
    if (typeof min_order_value_cents === 'number') updateData.min_order_value_cents = min_order_value_cents
    if (max_uses !== undefined) updateData.max_uses = max_uses
    if (uses_per_customer !== undefined) updateData.uses_per_customer = uses_per_customer

    // If code is changing, ensure uniqueness within tenant
    if (updateData.code) {
      const { data: existing, error: existErr } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('code', updateData.code as string)
        .neq('id', id)
        .maybeSingle()
      if (existErr) {
        console.error('Error checking code uniqueness:', existErr)
        return NextResponse.json({ error: 'Failed to validate coupon code' }, { status: 500 })
      }
      if (existing) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
      }
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in PATCH /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Delete coupon
    // Resolve tenant via middleware-provided context (header/cookie)
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
