import { supabaseAdmin } from '@/server/supabaseAdmin'

export interface MembershipStatus {
  id: string | null
  membershipType: 'PREMIUM' | null
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | null
  validUntil: string | null
  isTrial: boolean
  daysRemaining: number
  isActive: boolean
  expiresSoon: boolean
}

export interface MembershipPricing {
  id: string
  durationMonths: number
  priceCents: number
  currency: string
  priceDisplay: string
  monthlyRate: string
  savings?: string
}

export interface CashbackCalculation {
  eligibleAmountCents: number
  cashbackRatePct: number
  cashbackEarnedCents: number
  hasActiveMembership: boolean
}

/**
 * Get customer's current membership status
 */
export async function getMembershipStatus(
  customerId: string,
  tenantId: string
): Promise<MembershipStatus> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_active_membership', {
        p_customer_id: customerId,
        p_tenant_id: tenantId
      })

    if (error) {
      console.error('[getMembershipStatus] Error:', error)
      return {
        id: null,
        membershipType: null,
        status: null,
        validUntil: null,
        isTrial: false,
        daysRemaining: 0,
        isActive: false,
        expiresSoon: false
      }
    }

    const membership = data[0]
    if (!membership) {
      return {
        id: null,
        membershipType: null,
        status: null,
        validUntil: null,
        isTrial: false,
        daysRemaining: 0,
        isActive: false,
        expiresSoon: false
      }
    }

    return {
      id: membership.membership_id,
      membershipType: membership.membership_type,
      status: membership.status,
      validUntil: membership.valid_until,
      isTrial: membership.is_trial || false,
      daysRemaining: membership.days_remaining || 0,
      isActive: membership.status === 'ACTIVE' && membership.days_remaining > 0,
      expiresSoon: membership.days_remaining <= 7 && membership.days_remaining > 0
    }
  } catch (error) {
    console.error('[getMembershipStatus] Exception:', error)
    return {
      id: null,
      membershipType: null,
      status: null,
      validUntil: null,
      isTrial: false,
      daysRemaining: 0,
      isActive: false,
      expiresSoon: false
    }
  }
}

/**
 * Get available membership pricing options
 */
export async function getMembershipPricing(tenantId: string): Promise<MembershipPricing[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_pricing')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('duration_months', { ascending: true })

    if (error) {
      console.error('[getMembershipPricing] Error:', error)
      return []
    }

    return data.map(pricing => {
      const monthlyRate = pricing.price_cents / 100 / pricing.duration_months
      const originalMonthlyRate = 499 // ₹499 original price
      const savings = pricing.duration_months > 1 
        ? `Save ₹${Math.round((originalMonthlyRate - monthlyRate) * pricing.duration_months)}`
        : undefined

      return {
        id: pricing.id,
        durationMonths: pricing.duration_months,
        priceCents: pricing.price_cents,
        currency: pricing.currency,
        priceDisplay: `₹${(pricing.price_cents / 100).toFixed(0)}`,
        monthlyRate: `₹${Math.round(monthlyRate)}/month`,
        originalPrice: `₹${originalMonthlyRate}`, // Add original price for strikethrough
        savings
      }
    })
  } catch (error) {
    console.error('[getMembershipPricing] Exception:', error)
    return []
  }
}

/**
 * Calculate cashback for an order (only for premium members)
 */
export async function calculateCashback(
  tenantId: string,
  customerId: string,
  orderTotalCents: number,
  discountAmountCents: number,
  walletUsedCents: number
): Promise<CashbackCalculation> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('calculate_premium_cashback', {
        p_tenant_id: tenantId,
        p_customer_id: customerId,
        p_order_total_cents: orderTotalCents,
        p_discount_amount_cents: discountAmountCents,
        p_wallet_used_cents: walletUsedCents
      })

    if (error) {
      console.error('[calculateCashback] Error:', error)
      return {
        eligibleAmountCents: 0,
        cashbackRatePct: 0,
        cashbackEarnedCents: 0,
        hasActiveMembership: false
      }
    }

    const result = data[0]
    return {
      eligibleAmountCents: result.eligible_amount_cents,
      cashbackRatePct: result.cashback_rate_pct,
      cashbackEarnedCents: result.cashback_earned_cents,
      hasActiveMembership: result.has_active_membership
    }
  } catch (error) {
    console.error('[calculateCashback] Exception:', error)
    return {
      eligibleAmountCents: 0,
      cashbackRatePct: 0,
      cashbackEarnedCents: 0,
      hasActiveMembership: false
    }
  }
}

/**
 * Create membership payment record for PhonePe integration
 */
export async function createMembershipPayment(
  tenantId: string,
  customerId: string,
  durationMonths: number,
  paymentProvider: string = 'phonepe'
): Promise<{ paymentId: string; paymentReference: string; amountCents: number }> {
  try {
    // Get pricing for duration
    const { data: pricing, error: pricingError } = await supabaseAdmin
      .from('membership_pricing')
      .select('price_cents')
      .eq('tenant_id', tenantId)
      .eq('duration_months', durationMonths)
      .eq('is_active', true)
      .single()

    if (pricingError || !pricing) {
      throw new Error('Membership pricing not found')
    }

    // Get or create membership record
    let membershipId: string
    const { data: existingMembership } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .single()

    if (existingMembership) {
      membershipId = existingMembership.id
    } else {
      // Create new membership record (will be activated after payment)
      const { data: newMembership, error: membershipError } = await supabaseAdmin
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          membership_type: 'PREMIUM',
          status: 'PENDING',
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_trial: false,
          auto_renew: false
        })
        .select('id')
        .single()

      if (membershipError || !newMembership) {
        throw new Error('Failed to create membership record')
      }
      membershipId = newMembership.id
    }

    const paymentReference = `MEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabaseAdmin
      .from('membership_payments')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        membership_id: membershipId,
        amount_cents: pricing.price_cents,
        payment_provider: paymentProvider,
        payment_reference: paymentReference,
        payment_status: 'PENDING'
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createMembershipPayment] Error:', error)
      throw new Error('Failed to create membership payment record')
    }

    return {
      paymentId: data.id,
      paymentReference,
      amountCents: pricing.price_cents
    }
  } catch (error) {
    console.error('[createMembershipPayment] Exception:', error)
    throw error
  }
}

/**
 * Update membership payment status and activate membership
 */
export async function updateMembershipPaymentStatus(
  paymentReference: string,
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
  paymentData?: any
): Promise<void> {
  try {
    // Update payment status
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('membership_payments')
      .update({
        payment_status: status,
        payment_data: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('payment_reference', paymentReference)
      .select('membership_id, customer_id, tenant_id, amount_cents')
      .single()

    if (paymentError) {
      console.error('[updateMembershipPaymentStatus] Payment error:', paymentError)
      throw new Error('Failed to update payment status')
    }

    // If payment successful, activate/extend membership
    if (status === 'SUCCESS') {
      await activateMembership(payment.membership_id, payment.customer_id, payment.tenant_id)
    }
  } catch (error) {
    console.error('[updateMembershipPaymentStatus] Exception:', error)
    throw error
  }
}

/**
 * Activate or extend membership after successful payment
 */
async function activateMembership(
  membershipId: string,
  customerId: string,
  tenantId: string
): Promise<void> {
  try {
    // Get current membership
    const { data: membership, error: fetchError } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('id', membershipId)
      .single()

    if (fetchError) {
      throw new Error('Failed to fetch membership')
    }

    const now = new Date()
    let newValidFrom: Date
    let newValidUntil: Date

    // Check if there's an active membership
    const { data: activeMembership } = await supabaseAdmin
      .from('memberships')
      .select('valid_until')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')
      .gt('valid_until', now.toISOString())
      .order('valid_until', { ascending: false })
      .limit(1)
      .single()

    if (activeMembership && new Date(activeMembership.valid_until) > now) {
      // Extend existing active membership
      newValidFrom = new Date(activeMembership.valid_until)
      newValidUntil = new Date(membership.valid_until)
    } else {
      // Activate new membership
      newValidFrom = now
      newValidUntil = new Date(membership.valid_until)
    }

    // Update membership status
    const { error: updateError } = await supabaseAdmin
      .from('memberships')
      .update({
        status: 'ACTIVE',
        valid_from: newValidFrom.toISOString(),
        valid_until: newValidUntil.toISOString(),
        is_trial: false,
        updated_at: now.toISOString()
      })
      .eq('id', membershipId)

    if (updateError) {
      throw new Error('Failed to activate membership')
    }

    console.log(`[activateMembership] Successfully activated membership ${membershipId}`)
  } catch (error) {
    console.error('[activateMembership] Exception:', error)
    throw error
  }
}

/**
 * Process cashback for completed order (only for premium members)
 */
export async function processCashback(
  tenantId: string,
  orderId: string,
  customerId: string,
  eligibleAmountCents: number,
  cashbackRatePct: number,
  cashbackEarnedCents: number
): Promise<void> {
  try {
    // Get active membership
    const membershipStatus = await getMembershipStatus(customerId, tenantId)
    
    if (!membershipStatus.isActive || !membershipStatus.id) {
      console.log('[processCashback] No active membership, skipping cashback')
      return
    }

    // Create cashback transaction record
    const { data: cashbackTransaction, error: transactionError } = await supabaseAdmin
      .from('premium_cashback_transactions')
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        customer_id: customerId,
        membership_id: membershipStatus.id,
        eligible_amount_cents: eligibleAmountCents,
        cashback_rate_pct: cashbackRatePct,
        cashback_earned_cents: cashbackEarnedCents,
        status: 'PENDING'
      })
      .select('id')
      .single()

    if (transactionError) {
      console.error('[processCashback] Transaction error:', transactionError)
      throw new Error('Failed to create cashback transaction')
    }

    // Get wallet account ID
    const { data: walletAccount, error: walletError } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .single()

    if (walletError || !walletAccount) {
      console.error('[processCashback] Wallet error:', walletError)
      throw new Error('Failed to get wallet account')
    }

    // Credit cashback to wallet
    const { error: ledgerError } = await supabaseAdmin
      .from('wallet_ledger')
      .insert({
        account_id: walletAccount.id,
        entry_type: 'CREDIT',
        amount_cents: cashbackEarnedCents,
        source_key: 'PREMIUM_CASHBACK',
        reference_id: orderId,
        metadata: {
          cashback_transaction_id: cashbackTransaction.id,
          cashback_rate_pct: cashbackRatePct,
          eligible_amount_cents: eligibleAmountCents
        }
      })

    if (ledgerError) {
      console.error('[processCashback] Ledger error:', ledgerError)
      throw new Error('Failed to credit cashback to wallet')
    }

    // Update cashback transaction status
    const { error: updateError } = await supabaseAdmin
      .from('premium_cashback_transactions')
      .update({
        wallet_credited_cents: cashbackEarnedCents,
        status: 'PROCESSED',
        processed_at: new Date().toISOString()
      })
      .eq('id', cashbackTransaction.id)

    if (updateError) {
      console.error('[processCashback] Update error:', updateError)
      throw new Error('Failed to update cashback transaction status')
    }

    console.log(`[processCashback] Successfully processed ₹${cashbackEarnedCents/100} cashback for order ${orderId}`)
  } catch (error) {
    console.error('[processCashback] Exception:', error)
    throw error
  }
}

/**
 * Get cashback settings for tenant
 */
export async function getCashbackSettings(tenantId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('cashback_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('[getCashbackSettings] Error:', error)
      // Return default settings
      return {
        cashback_rate_pct: 5.00,
        min_order_amount_cents: 50000,
        max_cashback_per_order_cents: 50000,
        max_cashback_per_month_cents: 500000
      }
    }

    return data
  } catch (error) {
    console.error('[getCashbackSettings] Exception:', error)
    return {
      cashback_rate_pct: 5.00,
      min_order_amount_cents: 50000,
      max_cashback_per_order_cents: 50000,
      max_cashback_per_month_cents: 500000
    }
  }
}