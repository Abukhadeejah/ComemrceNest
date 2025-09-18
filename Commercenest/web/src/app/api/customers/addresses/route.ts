import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import type { CustomerAddress, AddressCreateRequest } from '@/types/customer'

// Get customer addresses
export async function GET() {
  try {
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

    // Get addresses
    const { data: addresses, error: addressesError } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressesError) {
      console.error('Get addresses error:', addressesError)
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ addresses: addresses as CustomerAddress[] })

  } catch (error) {
    console.error('Get addresses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new address
export async function POST(request: NextRequest) {
  try {
    const body: AddressCreateRequest = await request.json()
    const { name, phone, line1, line2, city, state, pincode, country = 'IN', isDefault = false } = body

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

    // If this is set as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('customer_id', customer.id)
    }

    // Create address
    const { data: address, error: addressError } = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id,
        name,
        phone,
        line1,
        line2,
        city,
        state,
        pincode,
        country,
        is_default: isDefault
      })
      .select()
      .single()

    if (addressError) {
      console.error('Create address error:', addressError)
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      address
    })

  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
