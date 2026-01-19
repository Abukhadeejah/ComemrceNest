/**
 * CASHBACK SYSTEM TYPE DEFINITIONS
 * 
 * Centralized type definitions for cashback system
 */

// ============================================================================
// DATABASE TYPES (matching Supabase schema)
// ============================================================================

export interface Membership {
  id: string
  tenant_id: string
  customer_id: string
  membership_type: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CashbackTransaction {
  id: string
  tenant_id: string
  order_id: string
  customer_id: string
  wallet_used_cents: number
  cash_paid_cents: number
  profit_pct: number
  cashback_pct: number
  cashback_amount_cents: number
  created_at: string
}

export interface CashbackSlab {
  id: string
  min_profit_pct: number
  max_profit_pct: number
  cashback_pct: number
  created_at: string
}

export interface WalletAccount {
  id: string
  customer_id: string
  tenant_id: string
  created_at: string
}

export interface WalletLedgerEntry {
  id: string
  account_id: string
  tenant_id: string
  entry_type: 'CREDIT' | 'DEBIT'
  amount_cents: number
  currency: string
  source_key: string
  reference_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface WalletBalance {
  wallet_account_id: string
  customer_id: string
  tenant_id: string
  balance_cents: number
  created_at: string
}

// ============================================================================
// ORDER TYPES (updated with cashback fields)
// ============================================================================

export interface OrderWithCashback {
  id: string
  tenant_id: string
  order_number: string
  email: string
  total_cents: number
  total_purchase_price_cents: number | null
  total_profit_pct: number | null
  wallet_used_cents: number
  cash_paid_cents: number
  cashback_pct: number | null
  cashback_amount_cents: number | null
  membership_id: string | null
  status: string
  currency: string
  payment_provider: string
  payment_env: string
  created_at: string
  razorpay_order_id: string | null
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateOrderRequest {
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    variantId?: string
  }>
  walletUsedRupees: number
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
}

export interface CreateOrderResponse {
  success: boolean
  order: {
    id: string
    orderNumber: string
    totalCents: number
    walletUsedCents: number
    cashPaidCents: number
    status: string
    cashback: {
      earned: number  // In cents
      percentage: number
      profitPercentage: number
      membershipUsed: boolean
    }
  }
}

export interface WalletBalanceResponse {
  balance: {
    cents: number
    rupees: string
    formatted: string
  }
  recentTransactions: Array<{
    id: string
    entry_type: 'CREDIT' | 'DEBIT'
    amount_cents: number
    currency: string
    source_key: string
    reference_id: string | null
    metadata: Record<string, unknown>
    created_at: string
  }>
}

export interface CashbackPreviewRequest {
  customerId: string
  totalSalePriceCents: number
  totalPurchasePriceCents: number
  walletUsedCents: number
  cashPaidCents: number
}

export interface CashbackPreviewResponse {
  eligible: boolean
  reason?: string
  profitPct: number
  cashbackPct: number
  cashbackAmount: number  // In cents
}

export interface CashbackStatsResponse {
  stats: {
    totalEarned: {
      cents: number
      rupees: string
      formatted: string
    }
    totalOrders: number
    averagePercentage: number
  }
  recentCashback: Array<{
    orderId: string
    orderNumber: string
    cashPaidCents: number
    walletUsedCents: number
    profitPct: number
    cashbackPct: number
    cashbackEarned: {
      cents: number
      rupees: string
      formatted: string
    }
    createdAt: string
  }>
}

export interface TransactionsResponse {
  transactions: Array<{
    id: string
    entry_type: 'CREDIT' | 'DEBIT'
    amount_cents: number
    currency: string
    source_key: string
    reference_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    amountRupees: string
    formattedAmount: string
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface WalletCheckoutProps {
  customerId: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    priceCents: number
    costCents: number
  }>
  onSubmit: (data: {
    walletUsedRupees: number
    cashPaidRupees: number
  }) => void | Promise<void>
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export interface CashbackCalculationInput {
  totalSalePrice: number      // In rupees
  totalPurchasePrice: number  // In rupees
  walletUsed: number          // In rupees
  cashPaid: number            // In rupees
}

export interface CashbackResult {
  profitPct: number
  cashbackPct: number
  cashbackAmount: number  // In rupees
}

export interface PaymentValidation {
  valid: boolean
  error?: string
}

export interface OrderItem {
  productId: string
  quantity: number
  salePrice: number
  purchasePrice: number
}

export interface MultiItemCashbackResult extends CashbackResult {
  itemBreakdown: Array<{
    profitPct: number
    cashbackPct: number
    cashAllocated: number
    cashbackAmount: number
  }>
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

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

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MembershipType = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type EntryType = 'CREDIT' | 'DEBIT'
export type WalletSourceKey = 
  | 'INITIAL_BALANCE' 
  | 'CASHBACK' 
  | 'ORDER_PAYMENT' 
  | 'REFUND' 
  | 'ADJUSTMENT'
  | 'WITHDRAWAL'

// ============================================================================
// CONSTANTS
// ============================================================================

export const MEMBERSHIP_TYPES = {
  FREE: 'FREE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
} as const

export const WALLET_SOURCE_KEYS = {
  INITIAL_BALANCE: 'INITIAL_BALANCE',
  CASHBACK: 'CASHBACK',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
  WITHDRAWAL: 'WITHDRAWAL'
} as const

export const ENTRY_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT'
} as const

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isCreditEntry(entry: WalletLedgerEntry): boolean {
  return entry.entry_type === 'CREDIT'
}

export function isDebitEntry(entry: WalletLedgerEntry): boolean {
  return entry.entry_type === 'DEBIT'
}

export function isActiveMembership(membership: Membership): boolean {
  return membership.is_active && new Date(membership.valid_until) > new Date()
}

export function isCashbackSource(entry: WalletLedgerEntry): boolean {
  return entry.source_key === WALLET_SOURCE_KEYS.CASHBACK
}

// ============================================================================
// HELPER TYPES FOR QUERIES
// ============================================================================

export interface CashbackHistoryItem {
  id: string
  order_id: string
  wallet_used_cents: number
  cash_paid_cents: number
  profit_pct: number
  cashback_pct: number
  cashback_amount_cents: number
  created_at: string
  orders: Array<{
    order_number: string
    total_cents: number
    status: string
  }>
}

export interface CashbackStats {
  totalCashbackEarned: number  // In cents
  totalOrders: number
  averageCashbackPct: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class CashbackError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'CashbackError'
  }
}

export class InsufficientWalletBalanceError extends CashbackError {
  constructor(required: number, available: number) {
    super(
      `Insufficient wallet balance. Required: ₹${required}, Available: ₹${available}`,
      'INSUFFICIENT_WALLET_BALANCE',
      { required, available }
    )
  }
}

export class InvalidPaymentSplitError extends CashbackError {
  constructor(message: string) {
    super(message, 'INVALID_PAYMENT_SPLIT')
  }
}

export class NoActiveMembershipError extends CashbackError {
  constructor(customerId: string) {
    super(
      'Customer does not have an active membership',
      'NO_ACTIVE_MEMBERSHIP',
      { customerId }
    )
  }
}

export class MissingCostPriceError extends CashbackError {
  constructor(productId: string, productName: string) {
    super(
      `Product "${productName}" has no cost price set. Cannot calculate cashback.`,
      'MISSING_COST_PRICE',
      { productId, productName }
    )
  }
}

// ============================================================================
// NOTE: All types are already exported via individual export statements above
// No need for a separate export block that causes conflicts
// ============================================================================
