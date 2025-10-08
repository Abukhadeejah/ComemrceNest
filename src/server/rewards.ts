import { supabaseAdmin } from './supabaseAdmin'

export interface OrderContext {
  subtotal_cents: number
  shipping_cents?: number
  cost_cents?: number
  discounts_cents?: number
  currency?: string
}

export interface CashbackResult {
  cashback_cents: number
  profit_cents: number
  rule: {
    rate: number
    capRate: number
    minOrderCents?: number
    maxCashbackCents?: number
  }
  reason: string
  metadata: Record<string, unknown>
}

export interface TenantRewardConfig {
  rate: number
  capRate: number
  minOrderCents?: number
  maxCashbackCents?: number
}

/**
 * Get cashback rate based on profit percentage (tiered system)
 * Based on the handwritten document specifications
 */
function getCashbackRateByProfitPercentage(profitPercentage: number): number {
  if (profitPercentage >= 31 && profitPercentage <= 40) return 0.10  // 10%
  if (profitPercentage >= 41 && profitPercentage <= 50) return 0.15  // 15%
  if (profitPercentage >= 51 && profitPercentage <= 60) return 0.20  // 20%
  if (profitPercentage >= 61 && profitPercentage <= 70) return 0.25  // 25%
  if (profitPercentage >= 71 && profitPercentage <= 80) return 0.30  // 30%
  if (profitPercentage >= 81 && profitPercentage <= 90) return 0.35  // 35%
  if (profitPercentage >= 91 && profitPercentage <= 100) return 0.40 // 40%
  if (profitPercentage >= 101 && profitPercentage <= 150) return 0.50 // 50%
  if (profitPercentage >= 151 && profitPercentage <= 200) return 0.50 // 50%
  if (profitPercentage >= 201 && profitPercentage <= 250) return 0.55 // 55%
  if (profitPercentage >= 251 && profitPercentage <= 300) return 0.55 // 55%
  if (profitPercentage >= 351 && profitPercentage <= 400) return 0.55 // 55%
  if (profitPercentage >= 451 && profitPercentage <= 500) return 0.55 // 55%
  
  // For profit percentages below 31% or above 500%, no cashback
  return 0.00
}

/**
 * Get tenant-specific reward configuration
 * Falls back to default Senlysh rules if no custom config found
 */
export async function getTenantRewardConfig(tenantId: string): Promise<TenantRewardConfig> {
  try {
    // Check for tenant-specific reward configuration
    const { data: config } = await supabaseAdmin
      .from('tenant_modules')
      .select('config')
      .eq('tenant_id', tenantId)
      .eq('module_key', 'customer_rewards')
      .eq('enabled', true)
      .maybeSingle()

    const cfg = (config && typeof (config as Record<string, unknown>).config === 'object') ? (config as Record<string, unknown>).config as Record<string, unknown> : undefined
    const rewards = (cfg && typeof (cfg as Record<string, unknown>).rewards === 'object') ? (cfg as Record<string, unknown> & { rewards?: Record<string, unknown> }).rewards as Record<string, unknown> : undefined

    if (rewards) {
      return {
        rate: typeof rewards.rate === 'number' ? rewards.rate : 0.20,
        capRate: typeof rewards.capRate === 'number' ? rewards.capRate : 0.15,
        minOrderCents: typeof rewards.minOrderCents === 'number' ? rewards.minOrderCents : undefined,
        maxCashbackCents: typeof rewards.maxCashbackCents === 'number' ? rewards.maxCashbackCents : undefined,
      }
    }

    // Default Senlysh rules
    return {
      rate: 0.20, // 20% of profit
      capRate: 0.15, // Capped at 15% of subtotal
    }
  } catch (error) {
    console.error('Error fetching tenant reward config:', error)
    // Fallback to default rules
    return {
      rate: 0.20,
      capRate: 0.15,
    }
  }
}

/**
 * Calculate cashback for an order context
 * Returns cashback amount, profit, and metadata
 */
export async function calculateCashback(
  tenantId: string,
  orderContext: OrderContext
): Promise<CashbackResult> {
  const {
    subtotal_cents,
    shipping_cents = 0,
    cost_cents = 0,
    discounts_cents = 0,
    currency: _currency = 'INR'
  } = orderContext

  // Get tenant-specific reward configuration
  const config = await getTenantRewardConfig(tenantId)

  // Calculate profit: subtotal - shipping - cost - discounts
  const profit_cents = Math.max(0, subtotal_cents - shipping_cents - cost_cents - discounts_cents)

  // Apply minimum order check if configured
  if (config.minOrderCents && subtotal_cents < config.minOrderCents) {
    return {
      cashback_cents: 0,
      profit_cents,
      rule: config,
      reason: 'Order below minimum threshold',
      metadata: {
        minOrderCents: config.minOrderCents,
        actualOrderCents: subtotal_cents,
      }
    }
  }

  // Calculate profit percentage for tiered cashback system (Senlysh only)
  const profit_percentage = cost_cents > 0 ? (profit_cents / cost_cents) * 100 : 0
  
  // Get tenant name to check if tiered system should be used
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()
  
  // Use tiered cashback system only for Senlysh Fashion
  let effective_rate = config.rate
  let tiered_rate = 0
  
  if (tenant?.name === 'Senlysh Fashion') {
    tiered_rate = getCashbackRateByProfitPercentage(profit_percentage)
    if (tiered_rate > 0) {
      effective_rate = tiered_rate
    }
  }

  // Calculate cashback: effective_rate * profit, capped at capRate * subtotal
  const raw_cashback = Math.floor(profit_cents * effective_rate)
  const cap_cashback = Math.floor(subtotal_cents * config.capRate)
  let cashback_cents = Math.min(raw_cashback, cap_cashback)

  // Apply maximum cashback limit if configured
  if (typeof config.maxCashbackCents === 'number' && cashback_cents > config.maxCashbackCents) {
    cashback_cents = config.maxCashbackCents
  }

  return {
    cashback_cents,
    profit_cents,
    rule: config,
    reason: cashback_cents > 0 ? 'Cashback calculated successfully' : 'No cashback applicable',
    metadata: {
      subtotal_cents,
      shipping_cents,
      cost_cents,
      discounts_cents,
      profit_cents,
      profit_percentage,
      tiered_rate,
      effective_rate,
      raw_cashback,
      cap_cashback,
      applied_cap: raw_cashback > cap_cashback,
      applied_max_limit: typeof config.maxCashbackCents === 'number' && cashback_cents >= config.maxCashbackCents,
    }
  }
}

/**
 * Credit cashback to customer's wallet
 * Returns the created ledger entry or null if already exists (idempotent)
 */
export async function creditOrderCashback(
  tenantId: string,
  customerId: string,
  orderId: string,
  orderContext: OrderContext
): Promise<{ success: boolean; ledgerEntry?: Record<string, unknown>; error?: string }> {
  try {
    // Calculate cashback
    const cashbackResult = await calculateCashback(tenantId, orderContext)
    
    if (cashbackResult.cashback_cents === 0) {
      return {
        success: true,
        error: 'No cashback to credit'
      }
    }

    // Get customer's wallet account
    const { data: walletAccount } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!walletAccount) {
      return {
        success: false,
        error: 'Wallet account not found'
      }
    }

    // Insert cashback credit (idempotent due to unique index)
    const { data: ledgerEntry, error } = await supabaseAdmin
      .from('wallet_ledger')
      .insert({
        tenant_id: tenantId,
        account_id: walletAccount.id,
        entry_type: 'credit',
        amount_cents: cashbackResult.cashback_cents,
        currency: orderContext.currency || 'INR',
        source_key: 'order:cashback',
        reference_id: orderId,
        metadata: {
          order_id: orderId,
          ...cashbackResult.metadata,
          reason: cashbackResult.reason,
          rule: cashbackResult.rule,
        } as unknown as import('@/types/supabase').Json
      })
      .select()
      .maybeSingle()

    if (error) {
      // Check if it's a duplicate key error (idempotent)
      if ((error as unknown as { code?: string }).code === '23505') {
        return {
          success: true,
          error: 'Cashback already credited (idempotent)'
        }
      }
      return {
        success: false,
        error: (error as unknown as { message?: string }).message || 'Unknown error'
      }
    }

    return {
      success: true,
      ledgerEntry: ledgerEntry ?? undefined
    }
  } catch (error) {
    console.error('Error crediting order cashback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
