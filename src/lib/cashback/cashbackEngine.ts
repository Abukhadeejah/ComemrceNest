/**
 * CASHBACK ENGINE - PURE CALCULATION FUNCTIONS
 * 
 * Business Rules:
 * - Cashback ONLY applies to cash paid (not wallet amount)
 * - Dynamic cashback % based on profit margin
 * - Requires active membership to earn cashback
 * 
 * Example:
 * Product ₹100, profit 35% → 10% cashback slab
 * Customer pays: ₹10 wallet + ₹90 cash
 * Cashback = ₹90 × 10% = ₹9 (credited to wallet)
 */

export interface CashbackSlab {
  minProfitPct: number
  maxProfitPct: number
  cashbackPct: number
}

export interface CashbackCalculationInput {
  totalSalePrice: number      // In rupees (not cents)
  totalPurchasePrice: number  // In rupees (not cents)
  walletUsed: number          // In rupees
  cashPaid: number            // In rupees
}

export interface CashbackResult {
  profitPct: number
  cashbackPct: number
  cashbackAmount: number  // In rupees
}

/**
 * Cashback slabs mapping profit % to cashback %
 * Based on business requirements
 */
export const CASHBACK_SLABS: CashbackSlab[] = [
  { minProfitPct: 31, maxProfitPct: 40, cashbackPct: 10 },
  { minProfitPct: 41, maxProfitPct: 50, cashbackPct: 15 },
  { minProfitPct: 51, maxProfitPct: 60, cashbackPct: 20 },
  { minProfitPct: 61, maxProfitPct: 70, cashbackPct: 25 },
  { minProfitPct: 71, maxProfitPct: 80, cashbackPct: 30 },
  { minProfitPct: 81, maxProfitPct: 90, cashbackPct: 35 },
  { minProfitPct: 91, maxProfitPct: 100, cashbackPct: 40 },
  { minProfitPct: 101, maxProfitPct: 150, cashbackPct: 50 },
  { minProfitPct: 151, maxProfitPct: 200, cashbackPct: 50 },
  { minProfitPct: 201, maxProfitPct: 250, cashbackPct: 50 },
  { minProfitPct: 251, maxProfitPct: 300, cashbackPct: 55 },
  { minProfitPct: 351, maxProfitPct: 400, cashbackPct: 55 },
  { minProfitPct: 451, maxProfitPct: 500, cashbackPct: 55 },
]

/**
 * Calculate profit percentage from purchase and sale prices
 * Formula: ((salePrice - purchasePrice) / purchasePrice) * 100
 */
export function calculateProfitPercentage(
  purchasePrice: number,
  salePrice: number
): number {
  if (purchasePrice <= 0) {
    throw new Error('Purchase price must be greater than zero')
  }
  
  const profit = salePrice - purchasePrice
  const profitPct = (profit / purchasePrice) * 100
  
  return Math.round(profitPct * 100) / 100 // Round to 2 decimals
}

/**
 * Get cashback slab for given profit percentage
 * Returns {profitPct, cashbackPct}
 * 
 * Edge cases:
 * - profit 30.9% → 0% cashback (below minimum)
 * - profit 31.0% → 10% cashback (first slab)
 * - profit 35% → 10% cashback
 */
export function getCashbackSlab(
  purchasePrice: number,
  salePrice: number
): { profitPct: number; cashbackPct: number } {
  const profitPct = calculateProfitPercentage(purchasePrice, salePrice)
  
  // Find matching slab
  const slab = CASHBACK_SLABS.find(
    s => profitPct >= s.minProfitPct && profitPct <= s.maxProfitPct
  )
  
  return {
    profitPct,
    cashbackPct: slab ? slab.cashbackPct : 0
  }
}

/**
 * MAIN CALCULATION: Calculate cashback on cash paid only
 * 
 * CRITICAL: Cashback is ONLY on cashPaid, NOT on walletUsed
 * 
 * Example 1 (Partial wallet):
 *   totalSalePrice: ₹100
 *   totalPurchasePrice: ₹70 (profit = 42.86%)
 *   walletUsed: ₹10
 *   cashPaid: ₹90
 *   → cashback slab = 15% (41-50% profit range)
 *   → cashbackAmount = ₹90 × 15% = ₹13.50
 * 
 * Example 2 (Full wallet):
 *   totalSalePrice: ₹100
 *   walletUsed: ₹100
 *   cashPaid: ₹0
 *   → cashbackAmount = ₹0 (no cash paid)
 * 
 * Example 3 (Full cash):
 *   totalSalePrice: ₹100
 *   walletUsed: ₹0
 *   cashPaid: ₹100
 *   → cashbackAmount = ₹100 × cashback% (full cashback)
 */
export function calculateCashback(orderData: CashbackCalculationInput): CashbackResult {
  const { totalSalePrice, totalPurchasePrice, walletUsed, cashPaid } = orderData
  
  // Validation
  if (totalSalePrice <= 0) {
    throw new Error('Sale price must be greater than zero')
  }
  
  if (totalPurchasePrice <= 0) {
    throw new Error('Purchase price must be greater than zero')
  }
  
  if (walletUsed < 0 || cashPaid < 0) {
    throw new Error('Wallet used and cash paid must be non-negative')
  }
  
  const totalPaid = walletUsed + cashPaid
  const tolerance = 0.01 // Allow 1 paisa tolerance for rounding
  
  if (Math.abs(totalPaid - totalSalePrice) > tolerance) {
    throw new Error(
      `Payment split doesn't match total: wallet(${walletUsed}) + cash(${cashPaid}) = ${totalPaid}, expected ${totalSalePrice}`
    )
  }
  
  // Calculate profit and get cashback percentage
  const { profitPct, cashbackPct } = getCashbackSlab(totalPurchasePrice, totalSalePrice)
  
  // CRITICAL: Cashback ONLY on cash paid
  const cashbackAmount = (cashPaid * cashbackPct) / 100
  
  return {
    profitPct: Math.round(profitPct * 100) / 100,
    cashbackPct,
    cashbackAmount: Math.round(cashbackAmount * 100) / 100 // Round to 2 decimals
  }
}

/**
 * Calculate cashback for multiple order items
 * Each item may have different profit margins
 * 
 * Payment is split proportionally across all items based on their price
 */
export interface OrderItem {
  salePrice: number
  purchasePrice: number
  quantity: number
}

export interface MultiItemCashbackResult extends CashbackResult {
  itemBreakdown: Array<{
    profitPct: number
    cashbackPct: number
    cashAllocated: number
    cashbackAmount: number
  }>
}

export function calculateMultiItemCashback(
  items: OrderItem[],
  walletUsed: number,
  cashPaid: number
): MultiItemCashbackResult {
  // Calculate total sale price
  const totalSalePrice = items.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  )
  
  // Calculate total purchase price
  const totalPurchasePrice = items.reduce(
    (sum, item) => sum + item.purchasePrice * item.quantity,
    0
  )
  
  // Validate payment split
  const totalPaid = walletUsed + cashPaid
  const tolerance = 0.01
  
  if (Math.abs(totalPaid - totalSalePrice) > tolerance) {
    throw new Error(
      `Payment split doesn't match total: wallet(${walletUsed}) + cash(${cashPaid}) = ${totalPaid}, expected ${totalSalePrice}`
    )
  }
  
  // Calculate overall metrics
  const overallResult = calculateCashback({
    totalSalePrice,
    totalPurchasePrice,
    walletUsed,
    cashPaid
  })
  
  // Calculate per-item breakdown (proportional cash allocation)
  const itemBreakdown = items.map(item => {
    const itemTotal = item.salePrice * item.quantity
    const itemPurchaseTotal = item.purchasePrice * item.quantity
    
    // Allocate cash proportionally
    const cashAllocated = (itemTotal / totalSalePrice) * cashPaid
    
    // Get cashback slab for this item
    const { profitPct, cashbackPct } = getCashbackSlab(
      item.purchasePrice,
      item.salePrice
    )
    
    // Calculate cashback for allocated cash
    const cashbackAmount = (cashAllocated * cashbackPct) / 100
    
    return {
      profitPct: Math.round(profitPct * 100) / 100,
      cashbackPct,
      cashAllocated: Math.round(cashAllocated * 100) / 100,
      cashbackAmount: Math.round(cashbackAmount * 100) / 100
    }
  })
  
  return {
    ...overallResult,
    itemBreakdown
  }
}

/**
 * Validate payment split before processing order
 */
export function validatePaymentSplit(
  totalAmount: number,
  walletBalance: number,
  walletUsed: number,
  cashPaid: number
): { valid: boolean; error?: string } {
  // Check wallet has sufficient balance
  if (walletUsed > walletBalance) {
    return {
      valid: false,
      error: `Insufficient wallet balance. Available: ₹${walletBalance}, Requested: ₹${walletUsed}`
    }
  }
  
  // Check non-negative amounts
  if (walletUsed < 0) {
    return { valid: false, error: 'Wallet amount cannot be negative' }
  }
  
  if (cashPaid < 0) {
    return { valid: false, error: 'Cash amount cannot be negative' }
  }
  
  // Check total matches
  const totalPaid = walletUsed + cashPaid
  const tolerance = 0.01
  
  if (Math.abs(totalPaid - totalAmount) > tolerance) {
    return {
      valid: false,
      error: `Payment split doesn't match order total. Total: ₹${totalAmount}, Paid: ₹${totalPaid}`
    }
  }
  
  return { valid: true }
}

/**
 * Format rupees for display
 */
export function formatRupees(amount: number): string {
  return `₹${amount.toFixed(2)}`
}

/**
 * Convert cents to rupees
 */
export function centsToRupees(cents: number): number {
  return Math.round(cents) / 100
}

/**
 * Convert rupees to cents
 */
export function rupeesToCents(rupees: number): number {
  return Math.round(rupees * 100)
}
