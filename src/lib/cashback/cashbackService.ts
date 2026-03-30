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

const CASHBACK_CREDIT_DELAY_DAYS = 5
const CASHBACK_CREDIT_DELAY_MS = CASHBACK_CREDIT_DELAY_DAYS * 24 * 60 * 60 * 1000

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
  gstAmountCents?: number
}

export interface ProcessCashbackResult {
  cashbackEarned: number  // In cents
  cashbackPct: number
  profitPct: number
  membershipUsed: string | null
  transactionId: string
}

async function estimateCashbackGstOnCashPaidCents(
  tenantId: string,
  orderId: string,
  totalSalePriceCents: number,
  cashPaidCents: number
): Promise<number> {
  if (totalSalePriceCents <= 0 || cashPaidCents <= 0) {
    return 0
  }

  try {
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        unit_price_cents,
        products (
          tax_class_id,
          taxable
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)

    if (orderItemsError || !orderItems || orderItems.length === 0) {
      return 0
    }

    const taxClassIds = Array.from(new Set(
      orderItems
        .map(item => {
          const product = item.products as { tax_class_id?: string | null } | null
          return product?.tax_class_id || null
        })
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ))

    const taxRateMap = new Map<string, number>()
    if (taxClassIds.length > 0) {
      const { data: taxClasses } = await supabaseAdmin
        .from('tax_classes')
        .select('id, rate_percent')
        .eq('tenant_id', tenantId)
        .in('id', taxClassIds)

      for (const taxClass of taxClasses || []) {
        taxRateMap.set(taxClass.id, Number(taxClass.rate_percent) || 0)
      }
    }

    let grossFromItemsCents = 0
    let taxFromItemsCents = 0

    for (const item of orderItems) {
      const quantity = Number(item.quantity) || 0
      const unitPriceCents = Number(item.unit_price_cents) || 0
      const lineGrossCents = Math.max(unitPriceCents * quantity, 0)
      if (lineGrossCents <= 0) {
        continue
      }

      grossFromItemsCents += lineGrossCents

      const product = item.products as { tax_class_id?: string | null; taxable?: boolean | null } | null
      const isTaxable = product?.taxable !== false
      const taxRatePercent = isTaxable && product?.tax_class_id
        ? (taxRateMap.get(product.tax_class_id) || 0)
        : 0

      if (taxRatePercent > 0) {
        const lineTaxCents = Math.round((lineGrossCents * taxRatePercent) / (100 + taxRatePercent))
        taxFromItemsCents += Math.max(lineTaxCents, 0)
      }
    }

    if (grossFromItemsCents <= 0 || taxFromItemsCents <= 0) {
      return 0
    }

    const saleAdjustmentRatio = totalSalePriceCents / grossFromItemsCents
    const adjustedOrderTaxCents = Math.max(Math.round(taxFromItemsCents * saleAdjustmentRatio), 0)
    const cashShareRatio = Math.min(cashPaidCents / totalSalePriceCents, 1)
    const gstOnCashPaidCents = Math.round(adjustedOrderTaxCents * cashShareRatio)

    return Math.max(0, Math.min(gstOnCashPaidCents, cashPaidCents))
  } catch (error) {
    console.warn('[estimateCashbackGstOnCashPaidCents] Falling back to zero GST adjustment:', error)
    return 0
  }
}

/**
 * Credit cashback transactions that have completed the hold period.
 *
 * NOTE: Cashback is credited after a 5-day delay from transaction creation.
 */
export async function creditDueCashbackForCustomer(
  customerId: string,
  tenantId: string
): Promise<{ creditedCount: number; creditedAmountCents: number }> {
  let walletAccountId: string

  try {
    walletAccountId = await getWalletAccountId(customerId, tenantId)
  } catch {
    return { creditedCount: 0, creditedAmountCents: 0 }
  }

  const creditEligibleBefore = new Date(Date.now() - CASHBACK_CREDIT_DELAY_MS).toISOString()

  const { data: dueTransactions, error: dueError } = await supabaseAdmin
    .from('cashback_transactions')
    .select('id, order_id, cashback_amount_cents, created_at')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .gt('cashback_amount_cents', 0)
    .lte('created_at', creditEligibleBefore)
    .order('created_at', { ascending: true })

  if (dueError) {
    throw new Error(`Failed to fetch due cashback transactions: ${dueError.message}`)
  }

  if (!dueTransactions || dueTransactions.length === 0) {
    return { creditedCount: 0, creditedAmountCents: 0 }
  }

  let creditedCount = 0
  let creditedAmountCents = 0

  for (const transaction of dueTransactions) {
    const { data: existingCredit, error: existingCreditError } = await supabaseAdmin
      .from('wallet_ledger')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('account_id', walletAccountId)
      .eq('source_key', 'CASHBACK')
      .eq('reference_id', transaction.order_id)
      .maybeSingle()

    if (existingCreditError && existingCreditError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing cashback credit: ${existingCreditError.message}`)
    }

    if (existingCredit) {
      continue
    }

    await creditCashbackToWallet(
      walletAccountId,
      tenantId,
      transaction.order_id,
      transaction.cashback_amount_cents
    )

    await supabaseAdmin
      .from('orders')
      .update({ cashback_amount_cents: transaction.cashback_amount_cents })
      .eq('id', transaction.order_id)
      .eq('tenant_id', tenantId)

    creditedCount += 1
    creditedAmountCents += transaction.cashback_amount_cents
  }

  return { creditedCount, creditedAmountCents }
}

/**
 * Credit due cashback for multiple customer/tenant pairs in batch.
 * Designed for scheduled jobs.
 */
export async function creditDueCashbackForAllCustomers(
  maxCustomerTenantPairs: number = 200
): Promise<{
  scannedPairs: number
  creditedCount: number
  creditedAmountCents: number
}> {
  const safePairLimit = Math.min(Math.max(Math.floor(maxCustomerTenantPairs), 1), 500)
  const creditEligibleBefore = new Date(Date.now() - CASHBACK_CREDIT_DELAY_MS).toISOString()

  const { data: dueRows, error } = await supabaseAdmin
    .from('cashback_transactions')
    .select('tenant_id, customer_id')
    .gt('cashback_amount_cents', 0)
    .lte('created_at', creditEligibleBefore)
    .order('created_at', { ascending: true })
    .limit(Math.max(safePairLimit * 20, 200))

  if (error) {
    throw new Error(`Failed to fetch due cashback batch: ${error.message}`)
  }

  if (!dueRows || dueRows.length === 0) {
    return {
      scannedPairs: 0,
      creditedCount: 0,
      creditedAmountCents: 0
    }
  }

  const uniquePairs: Array<{ tenantId: string; customerId: string }> = []
  const seen = new Set<string>()

  for (const row of dueRows) {
    const key = `${row.tenant_id}:${row.customer_id}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    uniquePairs.push({ tenantId: row.tenant_id, customerId: row.customer_id })

    if (uniquePairs.length >= safePairLimit) {
      break
    }
  }

  let creditedCount = 0
  let creditedAmountCents = 0

  for (const pair of uniquePairs) {
    const result = await creditDueCashbackForCustomer(pair.customerId, pair.tenantId)
    creditedCount += result.creditedCount
    creditedAmountCents += result.creditedAmountCents
  }

  return {
    scannedPairs: uniquePairs.length,
    creditedCount,
    creditedAmountCents
  }
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
  // Auto-credit cashback that has completed hold period before reading balance
  try {
    await creditDueCashbackForCustomer(customerId, tenantId)
  } catch (creditError) {
    console.error('[getWalletBalance] Failed to process due cashback credits:', creditError)
  }

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
  
  const viewBalance = data.balance_cents || 0
  if (viewBalance !== 0) {
    return viewBalance
  }

  // Fallback for environments where v_wallet_balances CASE handling is stale.
  const { data: account, error: accountError } = await supabaseAdmin
    .from('wallet_accounts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (accountError) {
    throw new Error(`Failed to fetch wallet account for fallback balance: ${accountError.message}`)
  }

  if (!account?.id) {
    return 0
  }

  const { data: ledgerRows, error: ledgerError } = await supabaseAdmin
    .from('wallet_ledger')
    .select('entry_type, amount_cents')
    .eq('tenant_id', tenantId)
    .eq('account_id', account.id)

  if (ledgerError) {
    throw new Error(`Failed to fetch wallet ledger for fallback balance: ${ledgerError.message}`)
  }

  const computedBalance = (ledgerRows || []).reduce((sum, row) => {
    const kind = (row.entry_type || '').toLowerCase()
    if (kind === 'credit') return sum + (row.amount_cents || 0)
    if (kind === 'debit') return sum - (row.amount_cents || 0)
    return sum
  }, 0)

  return computedBalance
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
 * 2. Calculates cashback on cash paid minus GST portion
 * 3. Records cashback as pending (credited after hold period)
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
    cashPaidCents,
    gstAmountCents
  } = input
  
  // 1. Check for active membership
  const membership = await getActiveMembership(customerId, tenantId)
  
  // 2. Calculate cashback (always calculate for order record, even if no membership)
  const gstOnCashPaidCents = typeof gstAmountCents === 'number'
    ? Math.max(0, Math.min(Math.round(gstAmountCents), cashPaidCents))
    : await estimateCashbackGstOnCashPaidCents(tenantId, orderId, totalSalePriceCents, cashPaidCents)

  const cashbackBaseCents = Math.max(cashPaidCents - gstOnCashPaidCents, 0)

  const cashbackResult = calculateCashback({
    totalSalePrice: centsToRupees(totalSalePriceCents),
    totalPurchasePrice: centsToRupees(totalPurchasePriceCents),
    walletUsed: centsToRupees(walletUsedCents),
    cashPaid: centsToRupees(cashPaidCents),
    cashbackBaseAmount: centsToRupees(cashbackBaseCents)
  })
  
  const cashbackAmountCents = rupeesToCents(cashbackResult.cashbackAmount)
  
  // 3. Keep cashback pending for delayed credit (membership required)
  const pendingCashbackAmountCents = membership && cashbackAmountCents > 0
    ? cashbackAmountCents
    : 0
  
  // 4. Record cashback transaction (record even if 0 for audit trail)
  const transactionId = await recordCashbackTransaction(
    tenantId,
    orderId,
    customerId,
    walletUsedCents,
    cashPaidCents,
    cashbackResult.profitPct,
    cashbackResult.cashbackPct,
    pendingCashbackAmountCents
  )
  
  // Cashback is pending now and will be credited after hold period.
  return {
    cashbackEarned: 0,
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
  cashPaidCents: number,
  gstAmountCents: number = 0
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
  const cashbackBaseCents = Math.max(cashPaidCents - Math.max(gstAmountCents, 0), 0)

  const result = calculateCashback({
    totalSalePrice: centsToRupees(totalSalePriceCents),
    totalPurchasePrice: centsToRupees(totalPurchasePriceCents),
    walletUsed: centsToRupees(walletUsedCents),
    cashPaid: centsToRupees(cashPaidCents),
    cashbackBaseAmount: centsToRupees(cashbackBaseCents)
  })
  
  return {
    eligible: true,
    profitPct: result.profitPct,
    cashbackPct: result.cashbackPct,
    cashbackAmount: rupeesToCents(result.cashbackAmount)
  }
}
