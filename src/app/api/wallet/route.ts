/**
 * WALLET MANAGEMENT API
 * 
 * Endpoints for managing customer wallet:
 * - GET /api/wallet - Get wallet balance and details
 * - GET /api/wallet/transactions - Get transaction history
 * - GET /api/wallet/cashback-stats - Get cashback statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { 
  getWalletBalance, 
  getCashbackHistory, 
  getCashbackStats 
} from '@/lib/cashback/cashbackService'
import { supabaseAdmin } from '@/server/supabaseAdmin'

/**
 * GET /api/wallet - Get wallet balance and details
 * Query params: customerId
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    // Get wallet balance
    const balanceCents = await getWalletBalance(customerId, tenantId)
    
    // Get recent transactions (last 10)
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('wallet_ledger')
      .select(`
        id,
        entry_type,
        amount_cents,
        currency,
        source_key,
        reference_id,
        metadata,
        created_at
      `)
      .eq('tenant_id', tenantId)
      .eq('account_id', (await supabaseAdmin
        .from('wallet_accounts')
        .select('id')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .single()
      ).data?.id || '')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (txError && txError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch transactions: ${txError.message}`)
    }
    
    return NextResponse.json({
      balance: {
        cents: balanceCents,
        rupees: (balanceCents / 100).toFixed(2),
        formatted: `₹${(balanceCents / 100).toFixed(2)}`
      },
      recentTransactions: transactions || []
    })
    
  } catch (error: any) {
    console.error('[GET /api/wallet] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch wallet', message: error.message },
      { status: 500 }
    )
  }
}
