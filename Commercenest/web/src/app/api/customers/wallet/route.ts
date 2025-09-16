import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import type { WalletResponse } from '@/types/customer'

// Get wallet balance and transaction history
export async function GET(_request: NextRequest) {
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

    // Calculate current balance from ledger
    const { data: ledgerEntries } = await supabaseAdmin
      .from('wallet_ledger')
      .select('entry_type, amount_cents, source_key, reference_id, metadata, created_at')
      .eq('tenant_id', tenantId)
      .eq('account_id', walletAccount.id)
      .order('created_at', { ascending: false })

    // Calculate balance and running balance for each transaction
    let balanceCents = 0
    const transactions = ledgerEntries?.map(entry => {
      if (entry.entry_type === 'credit') {
        balanceCents += entry.amount_cents
      } else {
        balanceCents -= entry.amount_cents
      }

      return {
        id: entry.reference_id,
        type: entry.entry_type,
        amount_cents: entry.amount_cents,
        amount: entry.amount_cents / 100,
        source_key: entry.source_key,
        metadata: entry.metadata,
        created_at: entry.created_at,
        description: undefined,
        balance_after: balanceCents / 100, // Calculate running balance
      }
    }) || []

    const response: WalletResponse = {
      wallet: {
        account_id: walletAccount.id,
        balance_cents: balanceCents,
        currency: 'INR'
      },
      transactions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
