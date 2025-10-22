import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import type { CustomerRegistrationRequest, CustomerRegistrationResponse } from '@/types/customer'

export async function POST(request: NextRequest) {
  try {
    const body: CustomerRegistrationRequest = await request.json()
    const { email, password, phone, firstName, lastName, marketingOptIn = false } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get tenant ID from request
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    // Check if customer registration module is enabled for this tenant
    const validation = await validateCustomerFeatureAccess(tenantId, 'registration', 'Customer Registration')
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.error,
          message: validation.upgradeMessage
        },
        { status: 403 }
      )
    }

    // Check if customer already exists for this tenant
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle()

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    // Create Supabase client for auth operations
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_id: tenantId,
          user_type: 'customer'
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        tenant_id: tenantId,
        user_id: authData.user.id,
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        marketing_opt_in: marketingOptIn
      })
      .select()
      .single()

    if (customerError) {
      console.error('Customer creation error:', customerError)
      // Clean up auth user if customer creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create customer profile' },
        { status: 500 }
      )
    }

    // Create wallet account for the customer
    const { error: walletError } = await supabaseAdmin
      .from('wallet_accounts')
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id
      })

    if (walletError) {
      console.error('Wallet creation error:', walletError)
      // Don't fail registration for wallet creation error
    }

    const response: CustomerRegistrationResponse = {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        marketing_opt_in: customer.marketing_opt_in
      },
      user: {
        id: authData.user.id,
        email: authData.user.email || ''
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
