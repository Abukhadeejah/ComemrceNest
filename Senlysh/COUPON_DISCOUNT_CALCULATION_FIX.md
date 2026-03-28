# Coupon Discount Calculation Fix

**Date:** January 20, 2026  
**Issue:** 32% discount coupon on ₹400 product showing only ₹1 discount instead of ₹128  
**Status:** ✅ RESOLVED

## Problem Description

User reported that a 32% discount coupon applied to a ₹400 product was only reducing the price by ₹1 (from ₹400 to ₹399) instead of the expected ₹128 discount (₹400 to ₹272).

## Root Cause Analysis

The issue was in the checkout page (`src/app/(site)/checkout/page.tsx`) where discount calculations were incorrectly dividing `discount_amount_cents` by 100:

### Incorrect Code:
```typescript
const totalAfterDiscount = grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100
```

### Problem:
- `grandTotal` is stored in cents (e.g., 40000 cents for ₹400)
- `appliedCoupon.discount_amount_cents` is also in cents (e.g., 12800 cents for ₹128)
- Dividing `discount_amount_cents` by 100 converted it to rupees, causing incorrect calculation
- Result: 40000 - (12800/100) = 40000 - 128 = 39872 cents = ₹398.72 ≈ ₹399

## Solution Applied

### 1. Fixed Checkout Page Calculations

**File:** `src/app/(site)/checkout/page.tsx`

Fixed multiple instances where `discount_amount_cents` was incorrectly divided by 100:

```typescript
// ✅ CORRECT - Both values in cents
const totalAfterDiscount = grandTotal - (appliedCoupon?.discount_amount_cents || 0)

// ✅ CORRECT - formatPrice expects cents
formatPrice(appliedCoupon.discount_amount_cents)

// ✅ CORRECT - Wallet calculations with proper unit conversion
const finalAmount = totalAfterDiscount - (useWallet ? walletUsedRupees * 100 : 0)
```

### 2. Enhanced Checkout API

**File:** `src/app/api/checkout/route.ts`

Added proper discount and wallet deduction logic:

```typescript
// Apply discount if provided
let finalAmountPaise = totals.totalCents || body.amountPaise || 0;
if (body.discount_amount_cents && body.discount_amount_cents > 0) {
  finalAmountPaise = Math.max(0, finalAmountPaise - body.discount_amount_cents);
}

// Apply wallet deduction if provided
if (body.walletUsedRupees && body.walletUsedRupees > 0) {
  const walletUsedCents = Math.round(body.walletUsedRupees * 100);
  finalAmountPaise = Math.max(0, finalAmountPaise - walletUsedCents);
}
```

## Files Modified

1. **`src/app/(site)/checkout/page.tsx`**
   - Fixed discount display in coupon section
   - Fixed wallet slider max value calculation
   - Fixed cash payment amount display
   - Fixed payment button calculations
   - Fixed wallet usage calculations

2. **`src/app/api/checkout/route.ts`**
   - Added proper discount application to final payment amount
   - Added wallet deduction logic
   - Ensured minimum payment amount of 0

## Data Format Clarification

- **`grandTotal`**: Always in cents (e.g., 40000 cents = ₹400)
- **`discount_amount_cents`**: Always in cents (e.g., 12800 cents = ₹128)
- **`walletUsedRupees`**: In rupees (e.g., 50 = ₹50)
- **`formatPrice()`**: Expects cents, displays rupees

## Verification

The fix ensures:
- ✅ 32% discount on ₹400 = ₹128 discount (₹272 final price)
- ✅ Proper wallet integration with discounts
- ✅ Correct payment amount sent to payment providers
- ✅ Accurate cashback calculations
- ✅ Proper display formatting throughout UI

## Test Case

**Before Fix:**
- Product: ₹400 (40000 cents)
- Coupon: 32% discount
- Expected discount: ₹128 (12800 cents)
- Actual result: ₹399 (only ₹1 discount)

**After Fix:**
- Product: ₹400 (40000 cents)
- Coupon: 32% discount
- Calculated discount: ₹128 (12800 cents)
- Final price: ₹272 (27200 cents) ✅

## Related Files

- Database function: `migrations/fix_validate_coupon_function.sql` (already correct)
- Coupon validation API: `src/app/api/coupons/validate/route.ts` (already correct)
- Format utilities: `src/lib/cart.tsx` (already correct)

The database layer and validation logic were working correctly. The issue was purely in the frontend calculation and checkout API payment amount handling.