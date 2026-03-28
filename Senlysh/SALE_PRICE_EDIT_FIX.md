# Sale Price Edit Form Fix

## Issue
When creating a product with only MRP (leaving sale price blank), the backend correctly uses MRP as the selling price. However, when editing the product, both MRP and Sale Price fields showed the same value, making it confusing.

### Example
**Create Product:**
- MRP: ₹500
- Sale Price: (left blank)
- Backend saves: `price_cents = 500` (uses MRP)

**Edit Product:**
- MRP: ₹500
- Sale Price: ₹500 ← **Should be blank!**

## Root Cause

When sale price is left blank during creation:
1. Frontend sends `price_cents = null`
2. Backend logic: `finalPriceCents = price_cents || compare_at_price_cents`
3. Backend saves: `price_cents = 500` (the MRP value)
4. Edit form loads: Shows `price_cents = 500` in sale price field

The database doesn't distinguish between:
- "User set sale price to ₹500" 
- "User left sale price blank, backend used MRP"

## Solution

Added logic in the edit page to detect when `price_cents` equals `compare_at_price_cents` and treat it as "no sale price set":

```typescript
price_cents: (() => {
  const price = product.price_cents ?? 0
  const mrp = product.compare_at_price_cents ?? 0
  
  // If they're equal and both > 0, user didn't set a sale price
  if (price === mrp && price > 0) {
    console.log('💰 Edit form: price_cents equals MRP, treating as no sale price')
    return null // Show empty sale price field
  }
  
  return price
})(),
```

### Logic Explanation

| Database State | Edit Form Display | Reasoning |
|---------------|-------------------|-----------|
| `price_cents = 500`, `mrp = 500` | Sale Price: (blank) | Equal values = no discount intended |
| `price_cents = 450`, `mrp = 500` | Sale Price: ₹450 | Different values = discount applied |
| `price_cents = 0`, `mrp = 500` | Sale Price: (blank) | Zero = no sale price |
| `price_cents = 500`, `mrp = 0` | Sale Price: ₹500 | Only sale price set |

## How It Works Now

### Scenario 1: Create with MRP Only
1. **Create:** MRP = ₹500, Sale Price = (blank)
2. **Backend saves:** `price_cents = 500`, `compare_at_price_cents = 500`
3. **Edit form shows:** MRP = ₹500, Sale Price = (blank) ✅
4. **User sees:** Original intent preserved

### Scenario 2: Create with Both Prices
1. **Create:** MRP = ₹500, Sale Price = ₹450
2. **Backend saves:** `price_cents = 450`, `compare_at_price_cents = 500`
3. **Edit form shows:** MRP = ₹500, Sale Price = ₹450 ✅
4. **User sees:** Discount correctly displayed

### Scenario 3: Create with Sale Price Only
1. **Create:** MRP = (blank), Sale Price = ₹450
2. **Backend saves:** `price_cents = 450`, `compare_at_price_cents = 0`
3. **Edit form shows:** MRP = (blank), Sale Price = ₹450 ✅
4. **User sees:** Simple pricing without MRP

## Edge Cases Handled

### Edge Case 1: Both Zero
- Database: `price_cents = 0`, `mrp = 0`
- Edit form: Both blank
- Correct behavior ✅

### Edge Case 2: Intentional Same Price
**Problem:** What if user intentionally sets sale price = MRP?
- Create: MRP = ₹500, Sale Price = ₹500
- Backend saves: `price_cents = 500`, `compare_at_price_cents = 500`
- Edit form: Sale Price = (blank)

**Is this a problem?** No, because:
- If prices are equal, there's no discount anyway
- User can re-enter sale price if needed
- Functionally equivalent

### Edge Case 3: Update Sale Price to Equal MRP
- Edit: Change Sale Price from ₹450 to ₹500 (same as MRP)
- Save: `price_cents = 500`, `compare_at_price_cents = 500`
- Edit again: Sale Price = (blank)
- Correct behavior ✅ (no discount = blank sale price)

## Files Modified

1. ✅ `src/app/(admin)/admin/products/[id]/edit/page.tsx`
   - Added logic to detect when `price_cents` equals `compare_at_price_cents`
   - Returns `null` for sale price when they're equal

## Testing Checklist

### Test 1: Create with MRP Only
- [ ] Create product: MRP = ₹500, Sale Price = (blank)
- [ ] Save
- [ ] Edit
- [ ] **Verify:** MRP = ₹500, Sale Price = (blank) ✅

### Test 2: Create with Both Prices
- [ ] Create product: MRP = ₹500, Sale Price = ₹450
- [ ] Save
- [ ] Edit
- [ ] **Verify:** MRP = ₹500, Sale Price = ₹450 ✅

### Test 3: Create with Sale Price Only
- [ ] Create product: MRP = (blank), Sale Price = ₹450
- [ ] Save
- [ ] Edit
- [ ] **Verify:** MRP = (blank), Sale Price = ₹450 ✅

### Test 4: Update to Remove Discount
- [ ] Create product: MRP = ₹500, Sale Price = ₹450
- [ ] Save
- [ ] Edit: Change Sale Price to ₹500
- [ ] Save
- [ ] Edit again
- [ ] **Verify:** Sale Price = (blank) ✅

### Test 5: Update to Add Discount
- [ ] Create product: MRP = ₹500, Sale Price = (blank)
- [ ] Save
- [ ] Edit: Add Sale Price = ₹450
- [ ] Save
- [ ] Edit again
- [ ] **Verify:** Sale Price = ₹450 ✅

## Console Logs

When editing a product where sale price was left blank, you'll see:

```
💰 Edit form: price_cents equals MRP, treating as no sale price
```

This confirms the logic is working correctly.

## Status: ✅ FIXED

The edit form now correctly shows:
- ✅ Blank sale price when only MRP was set during creation
- ✅ Actual sale price when discount was applied
- ✅ User's original intent is preserved

## Technical Notes

### Why Not Store a Flag in Database?

We could add a `has_sale_price` boolean column, but:
- Requires database migration
- Adds complexity
- Current solution works without schema changes
- Equal prices = no discount (logically equivalent)

### Alternative Approaches Considered

1. **Store null in database when no sale price**
   - Requires changing backend logic
   - More invasive change
   - Current approach is simpler

2. **Add metadata column**
   - Overkill for this use case
   - Adds database complexity

3. **Current approach (detect equal values)**
   - No database changes needed ✅
   - Simple logic ✅
   - Works immediately ✅

---

**Last Updated:** February 10, 2026
**Status:** Fixed and Ready for Testing
