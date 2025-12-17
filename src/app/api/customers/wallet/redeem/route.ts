import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'

// Redeem/withdraw wallet balance
export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    // Check if customer wallet module is enabled
    const validation = await validateCustomerFeatureAccess(tenantId, 'wallet', 'Customer Wallet')
    
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

    // Get request body
    const body = await request.json()
    const { amount_cents, bank_details } = body

    if (!amount_cents || amount_cents <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Minimum withdrawal amount (₹100)
    if (amount_cents < 10000) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹100' },
        { status: 400 }
      )
    }

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get wallet account
    const { data: walletAccount } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .single()

    if (!walletAccount) {
      return NextResponse.json(
        { error: 'Wallet account not found' },
        { status: 404 }
      )
    }

    // Calculate current balance
    const { data: ledgerEntries } = await supabaseAdmin
      .from('wallet_ledger')
      .select('entry_type, amount_cents')
      .eq('tenant_id', tenantId)
      .eq('account_id', walletAccount.id)

    let balanceCents = 0
    ledgerEntries?.forEach(entry => {
      if (entry.entry_type === 'credit') {
        balanceCents += entry.amount_cents
      } else {
        balanceCents -= entry.amount_cents
      }
    })

    // Check if sufficient balance
    if (balanceCents < amount_cents) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // For now, just create a debit entry in wallet ledger (withdrawal table will be added later)
    const withdrawalId = crypto.randomUUID()
    
    // Create debit entry in wallet ledger
    const { error: ledgerError } = await supabaseAdmin
      .from('wallet_ledger')
      .insert({
        tenant_id: tenantId,
        account_id: walletAccount.id,
        entry_type: 'debit',
        amount_cents: amount_cents,
        source_key: 'withdrawal_request',
        reference_id: withdrawalId,
        metadata: {
          withdrawal_id: withdrawalId,
          status: 'pending',
          bank_details: bank_details,
          customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          customer_email: customer.email,
          customer_phone: customer.phone,
          requested_at: new Date().toISOString()
        }
      })

    if (ledgerError) {
      console.error('Ledger entry error:', ledgerError)
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawalId,
        amount_cents: amount_cents,
        amount: amount_cents / 100,
        status: 'pending',
        requested_at: new Date().toISOString()
      },
      message: 'Withdrawal request submitted successfully. It will be processed within 3-5 business days.'
    })

  } catch (error) {
    console.error('Redeem wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}