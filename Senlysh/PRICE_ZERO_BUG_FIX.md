# Price Showing as ₹0 Bug - FIXED

## Problem
After adding a new product, the selling price showed as ₹0 in:
- Product table (admin panel)
- Shop page (customer-facing)

## Root Cause
When users left the "Sale Price" field empty (intending to use MRP as the selling price), the system was:
1. Converting empty string to `0` cents
2. Saving `0` as the price in database
3. Displaying ₹0 to customers

**Expected Behavior:** If sale price is empty, use MRP as the selling price.

## Solution

### Part 1: Frontend - PricingSection Component
**File:** `src/app/(admin)/admin/products/components/PricingSection.tsx`

Changed `rupeesToCents` to return `null` for empty input instead of `0`:

```typescript
// ❌ Before: Empty input = 0
const rupeesToCents = (rupees: string): number => {
  if (!rupees || rupees.trim() === '') return 0  // Wrong!
  // ...
}

// ✅ After: Empty input = null
const rupeesToCents = (rupees: string): number | null => {
  if (!rupees || rupees.trim() === '') return null  // Correct!
  // ...
}
```

**Why:** `null` indicates "not provided" while `0` is a valid price value.

### Part 2: Backend - Create Product
**File:** `src/app/(admin)/admin/products/actions.ts` (createProduct function)

Added logic to use MRP when sale price is not provided:

```typescript
// If sale price is not provided or is 0, use MRP as the selling price
const finalPriceCents = productData.price_cents && productData.price_cents > 0 
  ? productData.price_cents 
  : productData.compare_at_price_cents || 0

console.log('💰 Price logic: sale_price =', productData.price_cents, 
            ', mrp =', productData.compare_at_price_cents, 
            ', final_price =', finalPriceCents)

// Use finalPriceCents in database insert
price_cents: finalPriceCents,
```

### Part 3: Backend - Update Product
**File:** `src/app/(admin)/admin/products/actions.ts` (updateProduct function)

Added same logic for product updates:

```typescript
// If sale price is not provided or is 0, use MRP as the selling price
if (productData.price_cents === 0 || productData.price_cents === null || productData.price_cents === undefined) {
  if (productData.compare_at_price_cents && productData.compare_at_price_cents > 0) {
    productData.price_cents = productData.compare_at_price_cents
    console.log('💰 Update: No sale price provided, using MRP as selling price:', productData.price_cents)
  }
}
```

## How It Works Now

### Scenario 1: Both MRP and Sale Price Provided
- **Input:** MRP = ₹500, Sale Price = ₹480
- **Result:** Selling price = ₹480, MRP shown crossed out
- **Display:** ~~₹500~~ ₹480

### Scenario 2: Only MRP Provided (Sale Price Empty)
- **Input:** MRP = ₹500, Sale Price = (empty)
- **Result:** Selling price = ₹500 (uses MRP)
- **Display:** ₹500

### Scenario 3: Only Sale Price Provided
- **Input:** MRP = (empty), Sale Price = ₹480
- **Result:** Selling price = ₹480
- **Display:** ₹480

### Scenario 4: Neither Provided
- **Input:** MRP = (empty), Sale Price = (empty)
- **Result:** Selling price = ₹0 (invalid, should be caught by validation)
- **Display:** ₹0

## Files Modified

1. ✅ `src/app/(admin)/admin/products/components/PricingSection.tsx`
   - Changed `rupeesToCents` to return `null` for empty input

2. ✅ `src/app/(admin)/admin/products/actions.ts`
   - Added price fallback logic in `createProduct`
   - Added price fallback logic in `updateProduct`

## Testing Checklist

### Create Product
- [x] Create product with MRP only → Uses MRP as selling price
- [x] Create product with both MRP and Sale Price → Uses Sale Price
- [x] Create product with Sale Price only → Uses Sale Price
- [x] Verify price displays correctly in product table
- [x] Verify price displays correctly on shop page

### Update Product
- [x] Update product, remove sale price → Falls back to MRP
- [x] Update product, add sale price → Uses new sale price
- [x] Update product, change MRP only → Selling price updates if no sale price

## Status
✅ **FIXED** - Price now correctly falls back to MRP when sale price is empty
✅ No TypeScript errors
✅ Ready for production

## Deployment Notes
- No database changes required
- No migration needed
- Just deploy code changes
- Existing products with ₹0 price will need manual fix (edit and save)

---

**Bug fixed successfully!**
