/**
 * WALLET TRANSACTIONS API
 * 
 * GET /api/wallet/transactions - Get detailed transaction history
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { creditDueCashbackForCustomer } from '@/lib/cashback/cashbackService'
import { sendWhatsAppMessage } from '@/server/notifications/whatsapp'

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
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    try {
      const result = await creditDueCashbackForCustomer(customerId, tenantId)

      if (result.success) {
        for (const creditedTransaction of result.creditedTransactions) {
          if (!creditedTransaction.phone) {
            continue
          }

          try {
            const firstName = creditedTransaction.firstName || 'valued customer'
            const cashbackAmountRupees = (creditedTransaction.cashbackAmountCents / 100).toFixed(2)

            await sendWhatsAppMessage(
              creditedTransaction.phone,
              `Hi ${firstName},\n\nYour wallet has been credited with ₹${cashbackAmountRupees} cashback for order #${creditedTransaction.orderId}. 💰\n\nThe amount is now available in your wallet balance.\n\nCommerceNest Team`,
              `cashback-${tenantId}-${creditedTransaction.orderId}`
            )
          } catch (notificationError) {
            console.error('[GET /api/wallet/transactions] Failed to send wallet credit notification:', notificationError)
          }
        }
      }
    } catch (error) {
      console.error('[GET /api/wallet/transactions] Failed to process due cashback credits:', error)
    }
    
    // Get wallet account ID
    const { data: walletAccount, error: walletError } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (walletError || !walletAccount) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }
    
    // Get transactions with pagination
    const { data: transactions, error: txError, count } = await supabaseAdmin
      .from('wallet_ledger')
      .select('*', { count: 'exact' })
      .eq('account_id', walletAccount.id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (txError) {
      throw new Error(`Failed to fetch transactions: ${txError.message}`)
    }
    
    // Calculate running balance for display
    const transactionsWithBalance = transactions?.map(tx => {
      const amount = tx.entry_type === 'CREDIT' ? tx.amount_cents : -tx.amount_cents
      return {
        ...tx,
        amountRupees: (amount / 100).toFixed(2),
        formattedAmount: `${amount > 0 ? '+' : ''}₹${Math.abs(amount / 100).toFixed(2)}`
      }
    })
    
    return NextResponse.json({
      transactions: transactionsWithBalance || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
    
  } catch (error: any) {
    console.error('[GET /api/wallet/transactions] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch transactions', message: error.message },
      { status: 500 }
    )
  }
}
