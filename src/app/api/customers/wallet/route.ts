import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import { getAuthenticatedUserId } from '@/server/auth'
import type { WalletResponse } from '@/types/customer'

// Get wallet balance and transaction history
export async function GET() {
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

    // Get authenticated user ID
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[Wallet API] Request from user:', userId, 'tenant:', tenantId)

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId) // Use user_id to find customer
      .single()

    if (!customer) {
      console.error('[Wallet API] Customer not found for user:', userId)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    console.log('[Wallet API] Customer found:', customer.id)

    // Get wallet account
    const { data: walletAccount, error: walletError } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .single()

    if (walletError || !walletAccount) {
      console.error('[Wallet API] Wallet account not found:', walletError)
      
      // Try to create a wallet account if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('wallet_accounts')
        .insert({
          tenant_id: tenantId,
          customer_id: customer.id
        })
        .select('id')
        .single()

      if (createError || !newWallet) {
        console.error('[Wallet API] Failed to create wallet account:', createError)
        return NextResponse.json(
          { error: 'Failed to initialize wallet account' },
          { status: 500 }
        )
      }

      console.log('[Wallet API] Created new wallet account:', newWallet.id)
      
      // Return empty wallet for new account
      const response: WalletResponse = {
        wallet: {
          account_id: newWallet.id,
          balance_cents: 0,
          currency: 'INR'
        },
        transactions: []
      }

      return NextResponse.json(response)
    }

    console.log('[Wallet API] Wallet account found:', walletAccount.id)

    // Calculate current balance from ledger
    const { data: ledgerEntries, error: ledgerError } = await supabaseAdmin
      .from('wallet_ledger')
      .select('entry_type, amount_cents, source_key, reference_id, metadata, created_at')
      .eq('tenant_id', tenantId)
      .eq('account_id', walletAccount.id)
      .order('created_at', { ascending: false })

    if (ledgerError) {
      console.error('[Wallet API] Error fetching ledger entries:', ledgerError)
    }

    console.log(`[Wallet API] Found ${ledgerEntries?.length || 0} ledger entries`)

    // Calculate total balance first (process all entries)
    let totalBalanceCents = 0
    ledgerEntries?.forEach(entry => {
      if (entry.entry_type === 'credit') {
        totalBalanceCents += entry.amount_cents
      } else {
        totalBalanceCents -= entry.amount_cents
      }
    })

    // Create transactions array with running balance (newest first)
    let runningBalance = totalBalanceCents
    const transactions = ledgerEntries?.map(entry => {
      const transaction = {
        id: entry.reference_id || `${entry.created_at}:${entry.source_key}`,
        type: entry.entry_type as 'credit' | 'debit',
        amount_cents: entry.amount_cents,
        amount: entry.amount_cents / 100,
        source_key: entry.source_key,
        metadata: (entry.metadata ?? {}) as unknown as Record<string, unknown>,
        created_at: entry.created_at,
        description: undefined,
        balance_after: runningBalance / 100,
      }

      // Update running balance for next iteration (going backwards in time)
      if (entry.entry_type === 'credit') {
        runningBalance -= entry.amount_cents
      } else {
        runningBalance += entry.amount_cents
      }

      return transaction
    }) || []

    const response: WalletResponse = {
      wallet: {
        account_id: walletAccount.id,
        balance_cents: totalBalanceCents,
        currency: 'INR'
      },
      transactions
    }

    console.log(`[Wallet API] Returning wallet with balance: ₹${totalBalanceCents / 100}, transactions: ${transactions.length}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
