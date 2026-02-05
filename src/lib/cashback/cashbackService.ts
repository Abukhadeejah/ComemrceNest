/**
 * CASHBACK SERVICE - DATABASE OPERATIONS
 * 
 * Handles all cashback-related database operations including:
 * - Recording cashback transactions
 * - Checking membership eligibility
 * - Crediting cashback to wallet
 */

import { supabaseAdmin } from '@/server/supabaseAdmin'
import { calculateCashback, centsToRupees, rupeesToCents } from './cashbackEngine'

// Types for new tables (created by migration)
type Membership = {
  id: string
  tenant_id: string
  customer_id: string
  membership_type: 'FREE' | 'PREMIUM'  // Updated to include FREE
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type CashbackTransaction = {
  tenant_id: string
  order_id: string
  customer_id: string
  wallet_used_cents: number
  cash_paid_cents: number
  profit_pct: number
  cashback_pct: number
  cashback_amount_cents: number
}

export interface ProcessCashbackInput {
  tenantId: string
  orderId: string
  customerId: string
  totalSalePriceCents: number
  totalPurchasePriceCents: number
  walletUsedCents: number
  cashPaidCents: number
}

export interface ProcessCashbackResult {
  cashbackEarned: number  // In cents
  cashbackPct: number
  profitPct: number
  membershipUsed: string | null
  transactionId: string
}

/**
 * Check if customer has an active membership (FREE or PREMIUM)
 */
export async function getActiveMembership(
  customerId: string,
  tenantId: string
): Promise<Membership | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')  // Changed from is_active to status
      .gte('valid_until', new Date().toISOString())
      .order('valid_until', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is expected if no membership exists
        return null
      }
      console.error('[getActiveMembership] Error fetching membership:', {
        code: error.code,
        message: error.message,
        details: error.details,
        customerId,
        tenantId
      })
      // Return null instead of throwing to gracefully handle missing memberships
      // This allows cashback preview to work even if membership table is empty
      return null
    }
    
    return data
  } catch (err: any) {
    console.error('[getActiveMembership] Exception:', err.message)
    // Gracefully handle errors - return null instead of throwing
    return null
  }
}

/**
 * Create FREE membership for new customer (1 year duration)
 * (This is also handled by database trigger, but provided for manual creation)
 */
export async function createFreeMembership(
  customerId: string,
  tenantId: string
): Promise<Membership> {
  const now = new Date()
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 1) // 1 year from now
  
  const { data, error } = await supabaseAdmin
    .from('memberships')
    .insert({
      customer_id: customerId,
      tenant_id: tenantId,
      membership_type: 'FREE',
      status: 'ACTIVE',  // Use status instead of is_active
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create membership: ${error.message}`)
  }
  
  return data
}

/**
 * Get wallet account ID for customer
 */
export async function getWalletAccountId(
  customerId: string,
  tenantId: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('wallet_accounts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .single()
  
  if (error) {
    throw new Error(`Failed to fetch wallet account: ${error.message}`)
  }
  
  return data.id
}

/**
 * Get current wallet balance in cents
 */
export async function getWalletBalance(
  customerId: string,
  tenantId: string
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('v_wallet_balances')
    .select('balance_cents')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No wallet account exists
      return 0
    }
    throw new Error(`Failed to fetch wallet balance: ${error.message}`)
  }
  
  return data.balance_cents || 0
}

/**
 * Credit cashback amount to customer wallet
 */
export async function creditCashbackToWallet(
  accountId: string,
  tenantId: string,
  orderId: string,
  cashbackAmountCents: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('wallet_ledger')
    .insert({
      account_id: accountId,
      tenant_id: tenantId,
      entry_type: 'credit', // Use lowercase to match constraint
      amount_cents: cashbackAmountCents,
      currency: 'INR',
      source_key: 'CASHBACK',
      reference_id: orderId,
      metadata: {
        description: 'Cashback earned from order',
        order_id: orderId
      }
    })
  
  if (error) {
    throw new Error(`Failed to credit cashback to wallet: ${error.message}`)
  }
}

/**
 * Debit wallet for order payment
 */
export async function debitWalletForOrder(
  accountId: string,
  tenantId: string,
  orderId: string,
  amountCents: number
): Promise<void> {
  if (amountCents <= 0) {
    return // Nothing to debit
  }
  
  const { error } = await supabaseAdmin
    .from('wallet_ledger')
    .insert({
      account_id: accountId,
      tenant_id: tenantId,
      entry_type: 'debit', // Use lowercase to match constraint
      amount_cents: amountCents,
      currency: 'INR',
      source_key: 'ORDER_PAYMENT',
      reference_id: orderId,
      metadata: {
        description: 'Payment for order',
        order_id: orderId
      }
    })
  
  if (error) {
    throw new Error(`Failed to debit wallet: ${error.message}`)
  }
}

/**
 * Record cashback transaction in database
 */
export async function recordCashbackTransaction(
  tenantId: string,
  orderId: string,
  customerId: string,
  walletUsedCents: number,
  cashPaidCents: number,
  profitPct: number,
  cashbackPct: number,
  cashbackAmountCents: number
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('cashback_transactions')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      customer_id: customerId,
      wallet_used_cents: walletUsedCents,
      cash_paid_cents: cashPaidCents,
      profit_pct: profitPct,
      cashback_pct: cashbackPct,
      cashback_amount_cents: cashbackAmountCents
    })
    .select('id')
    .single()
  
  if (error) {
    throw new Error(`Failed to record cashback transaction: ${error.message}`)
  }
  
  return data.id
}

/**
 * MAIN FUNCTION: Process cashback for an order
 * 
 * This function:
 * 1. Checks if customer has active membership
 * 2. Calculates cashback on cash paid only
 * 3. Credits cashback to wallet (if eligible)
 * 4. Records transaction
 * 5. Returns cashback details
 * 
 * NOTE: Wallet debit for payment should be done separately before calling this
 */
export async function processCashbackForOrder(
  input: ProcessCashbackInput
): Promise<ProcessCashbackResult> {
  const {
    tenantId,
    orderId,
    customerId,
    totalSalePriceCents,
    totalPurchasePriceCents,
    walletUsedCents,
    cashPaidCents
  } = input
  
  // 1. Check for active membership
  const membership = await getActiveMembership(customerId, tenantId)
  
  // 2. Calculate cashback (always calculate for order record, even if no membership)
  const cashbackResult = calculateCashback({
    totalSalePrice: centsToRupees(totalSalePriceCents),
    totalPurchasePrice: centsToRupees(totalPurchasePriceCents),
    walletUsed: centsToRupees(walletUsedCents),
    cashPaid: centsToRupees(cashPaidCents)
  })
  
  const cashbackAmountCents = rupeesToCents(cashbackResult.cashbackAmount)
  
  // 3. Credit cashback to wallet ONLY if active membership
  let actualCashbackCredited = 0
  
  if (membership && cashbackAmountCents > 0) {
    const walletAccountId = await getWalletAccountId(customerId, tenantId)
    await creditCashbackToWallet(
      walletAccountId,
      tenantId,
      orderId,
      cashbackAmountCents
    )
    actualCashbackCredited = cashbackAmountCents
  }
  
  // 4. Record cashback transaction (record even if 0 for audit trail)
  const transactionId = await recordCashbackTransaction(
    tenantId,
    orderId,
    customerId,
    walletUsedCents,
    cashPaidCents,
    cashbackResult.profitPct,
    cashbackResult.cashbackPct,
    actualCashbackCredited // Record actual amount credited (0 if no membership)
  )
  
  return {
    cashbackEarned: actualCashbackCredited,
    cashbackPct: cashbackResult.cashbackPct,
    profitPct: cashbackResult.profitPct,
    membershipUsed: membership?.id || null,
    transactionId
  }
}

/**
 * Get cashback history for a customer
 */
export async function getCashbackHistory(
  customerId: string,
  tenantId: string,
  limit: number = 50
) {
  const { data, error } = await supabaseAdmin
    .from('cashback_transactions')
    .select(`
      id,
      order_id,
      wallet_used_cents,
      cash_paid_cents,
      profit_pct,
      cashback_pct,
      cashback_amount_cents,
      created_at,
      orders (
        order_number,
        total_cents,
        status
      )
    `)
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to fetch cashback history: ${error.message}`)
  }
  
  return data
}

/**
 * Get cashback statistics for a customer
 */
export async function getCashbackStats(
  customerId: string,
  tenantId: string
): Promise<{
  totalCashbackEarned: number
  totalOrders: number
  averageCashbackPct: number
}> {
  const { data, error } = await supabaseAdmin
    .from('cashback_transactions')
    .select('cashback_amount_cents, cashback_pct')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
  
  if (error) {
    throw new Error(`Failed to fetch cashback stats: ${error.message}`)
  }
  
  const totalCashbackEarned = data.reduce((sum, t) => sum + t.cashback_amount_cents, 0)
  const totalOrders = data.length
  const averageCashbackPct = totalOrders > 0
    ? data.reduce((sum, t) => sum + t.cashback_pct, 0) / totalOrders
    : 0
  
  return {
    totalCashbackEarned,
    totalOrders,
    averageCashbackPct: Math.round(averageCashbackPct * 100) / 100
  }
}

/**
 * Preview cashback (before order is placed)
 * Used in frontend to show expected cashback
 */
export async function previewCashback(
  customerId: string,
  tenantId: string,
  totalSalePriceCents: number,
  totalPurchasePriceCents: number,
  walletUsedCents: number,
  cashPaidCents: number
): Promise<{
  eligible: boolean
  reason?: string
  profitPct: number
  cashbackPct: number
  cashbackAmount: number  // In cents
}> {
  // Check membership
  const membership = await getActiveMembership(customerId, tenantId)
  
  if (!membership) {
    return {
      eligible: false,
      reason: 'No active membership',
      profitPct: 0,
      cashbackPct: 0,
      cashbackAmount: 0
    }
  }
  
  // Calculate cashback
  const result = calculateCashback({
    totalSalePrice: centsToRupees(totalSalePriceCents),
    totalPurchasePrice: centsToRupees(totalPurchasePriceCents),
    walletUsed: centsToRupees(walletUsedCents),
    cashPaid: centsToRupees(cashPaidCents)
  })
  
  return {
    eligible: true,
    profitPct: result.profitPct,
    cashbackPct: result.cashbackPct,
    cashbackAmount: rupeesToCents(result.cashbackAmount)
  }
}
