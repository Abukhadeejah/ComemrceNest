import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Update address
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json() as {
      name?: string
      full_name?: string
      phone?: string
      line1?: string
      address_line_1?: string
      line2?: string
      address_line_2?: string
      city?: string
      state?: string
      pincode?: string
      postal_code?: string
      country?: string
      isDefault?: boolean
      is_default?: boolean
    }

    const name = (body.name ?? body.full_name ?? '').trim()
    const phone = (body.phone ?? '').trim()
    const line1 = (body.line1 ?? body.address_line_1 ?? '').trim()
    const line2 = (body.line2 ?? body.address_line_2 ?? '').trim()
    const city = (body.city ?? '').trim()
    const state = (body.state ?? '').trim()
    const pincode = String(body.pincode ?? body.postal_code ?? '').trim()
    const country = (body.country ?? 'IN').trim() || 'IN'
    const isDefault = Boolean(body.isDefault ?? body.is_default ?? false)

    // Validate required fields
    if (!line1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Address line 1, city, state, and pincode are required' },
        { status: 400 }
      )
    }

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    // Check if customer addresses module is enabled
    const validation = await validateCustomerFeatureAccess(tenantId, 'addresses', 'Customer Addresses')
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.error,
          message: validation.upgradeMessage
        },
        { status: 403 }
      )
    }

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify address belongs to customer
    const { data: existingAddress } = await supabaseAdmin
      .from('customer_addresses')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .eq('id', id)
      .single()

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('customer_id', customer.id)
        .neq('id', id)
    }

    // Update address
    const updateData: Record<string, unknown> = {
      name,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      country,
      is_default: isDefault,
      updated_at: new Date().toISOString()
    }

    const { data: address, error: addressError } = await supabaseAdmin
      .from('customer_addresses')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .eq('id', id)
      .select()
      .single()

    if (addressError) {
      console.error('Update address error:', addressError)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      address
    })

  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete address
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    // Check if customer addresses module is enabled
    const validation = await validateCustomerFeatureAccess(tenantId, 'addresses', 'Customer Addresses')
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.error,
          message: validation.upgradeMessage
        },
        { status: 403 }
      )
    }

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Delete address
    const { error: deleteError } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .eq('id', id)

    if (deleteError) {
      console.error('Delete address error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
