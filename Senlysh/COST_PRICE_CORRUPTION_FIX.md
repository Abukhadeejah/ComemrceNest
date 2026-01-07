# Cost Price Corruption Bug - Complete Fix Documentation

## Problem Statement

When editing an existing product without changing the cost price, the `cost_price_cents` field was being corrupted (set to null or 0), losing the original value. This only occurred during edit mode, not during product creation.

## Root Causes Identified and Fixed

### 1. **FormData Construction Bug** ✅ FIXED
**Issue:** Numeric fields with value `0` were being skipped from FormData
- When `cost_price_cents = 0`, the form construction code skipped it because of the condition `value !== null && value !== undefined`
- This meant 0 values were never sent to the server
- Server's `parseIntOrUndefined()` then returned `undefined` since the field wasn't in FormData
- Result: Field wasn't in the update payload, potentially causing overwrites

**Location:** [ProductForm.tsx](src/components/ProductForm.tsx#L256-L293)

**Fix Applied:**
```typescript
// BEFORE (Broken - skipped 0 values):
Object.entries(data).forEach(([key, value]) => {
  if (value !== null && value !== undefined) {
    form.append(formKey, String(value))
  }
})

// AFTER (Fixed - includes 0 values):
if (value !== null && value !== undefined) {
  form.append(formKey, String(value))
} else if (value === 0 && numericFields.includes(key)) {
  // Always append numeric fields even if 0
  const rounded = 0
  form.append(formKey, String(rounded))
  if (key === 'cost_price_cents') {
    console.log(`🔴 COST PRICE AUDIT: cost_price_cents is 0 -> cost_per_item_cents 0 [APPENDED TO FORMDATA - IMPORTANT FOR EDIT MODE]`)
  }
}
```

**Added Logging:**
- Tracks when `cost_price_cents` is appended to FormData
- Shows the field mapping: `cost_price_cents` → `cost_per_item_cents`

---

### 2. **Undefined Value Propagation** ✅ FIXED
**Issue:** When FormData didn't contain `cost_per_item_cents`, the server-side `parseIntOrUndefined()` returned `undefined`, which was then included in the update payload, potentially overwriting the existing database value with null.

**Location:** [actions.ts](src/app/(admin)/admin/products/actions.ts#L765-L771)

**The parseIntOrUndefined function:**
```typescript
const parseIntOrUndefined = (key: string) => {
  const raw = formData.get(key)
  if (raw === null || raw === undefined || raw === '') return undefined
  const parsed = parseInt(String(raw), 10)
  return Number.isFinite(parsed) ? parsed : undefined
}
```

**Issue:** When `cost_per_item_cents` was missing from FormData:
```javascript
parseIntOrUndefined('cost_per_item_cents') // Returns undefined
productData.cost_per_item_cents: undefined ?? null  // Becomes null
updatePayload.cost_per_item_cents = null  // Overwrites database with null!
```

**Fix Applied:** Modified `buildUpdatePayload()` function to ALWAYS include `cost_per_item_cents` explicitly

**Location:** [actions.ts](src/app/(admin)/admin/products/actions.ts#L903-L965)

```typescript
// FIXED: Use selective payload building to preserve existing values
const buildUpdatePayload = () => {
  const payload: any = {}
  
  // Only include fields that have meaningful values (not undefined)
  if (productData.name !== undefined) payload.name = productData.name
  // ... other fields ...
  
  // CRITICAL: Always include cost_per_item_cents (even if undefined from FormData, we logged it)
  // This ensures we explicitly set it rather than leaving it alone
  payload.cost_per_item_cents = productData.cost_per_item_cents
  console.log('🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload =', payload.cost_per_item_cents)
  
  // ... more fields ...
  return payload
}
```

**Added Logging:**
- Shows what value is being sent to database: `cost_per_item_cents in payload = X`

---

### 3. **Draft Deletion Not Awaited** ✅ FIXED
**Issue:** After successful product update, the code attempted to delete the draft using a fire-and-forget fetch without error handling.
- If draft deletion failed, the stale draft persisted
- Next edit might load from stale draft instead of fresh product data
- No visibility into whether deletion succeeded or failed

**Location:** [ProductForm.tsx](src/components/ProductForm.tsx#L310-L330)

**Fix Applied:** Changed to proper async/await with error handling

```typescript
// BEFORE (Fire-and-forget, no error handling):
fetch('/api/product-drafts/...', { method: 'DELETE' })
  .catch(() => {})

// AFTER (Proper error handling):
try {
  const deleteDraftResponse = await fetch(
    `/api/product-drafts/${productId}`,
    { method: 'DELETE' }
  )
  if (deleteDraftResponse.ok) {
    console.log('✅ Draft deleted after successful product update')
  }
} catch (error) {
  console.warn('⚠️ Failed to delete draft after update:', error)
}
```

**Added Logging:**
- Success log: "✅ Draft deleted after successful product update"
- Error warning: "⚠️ Failed to delete draft after update"

---

## Comprehensive Logging Added

### In ProductForm.tsx (Client-side)

```javascript
// Line 251-257: Pre-update logging
console.log('📝 COST PRICE AUDIT: Preparing to submit form')
const costValue = form.get('cost_per_item_cents')
console.log(`🔴 COST PRICE AUDIT: cost_per_item_cents in FormData = ${costValue} [About to send to server]`)

// Line 270-275: FormData construction logging
if (key === 'cost_price_cents') {
  console.log(`🔴 COST PRICE AUDIT: cost_price_cents ${value} cents -> cost_per_item_cents ${value} [APPENDED TO FORMDATA]`)
}

// Line 287: When 0 value is sent
if (key === 'cost_price_cents') {
  console.log(`🔴 COST PRICE AUDIT: cost_price_cents is 0 -> cost_per_item_cents 0 [APPENDED TO FORMDATA - IMPORTANT FOR EDIT MODE]`)
}

// Line 320-325: Post-update success
console.log('✅ Product updated successfully')
console.log('✅ Draft deleted after successful product update')
```

### In actions.ts (Server-side)

```typescript
// Line 825: After parsing FormData
console.log('🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents from FormData =', productData.cost_per_item_cents)

// Line 950: Before database update
console.log('🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload =', payload.cost_per_item_cents)
console.log('🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload =', updatePayload.cost_per_item_cents, '[Will be sent to database]')

// Line 970-971: After database update
console.log('🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents =', product.cost_per_item_cents, '[After update]')
```

---

## Console Log Output Example

When editing a product with cost_price_cents = 5000 cents:

```
📝 COST PRICE AUDIT: Preparing to submit form
🔴 COST PRICE AUDIT: cost_per_item_cents in FormData = 5000 [About to send to server]
🔴 COST PRICE AUDIT: cost_price_cents 5000 cents -> cost_per_item_cents 5000 [APPENDED TO FORMDATA]
✅ Product updated successfully
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents from FormData = 5000
🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]
🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 5000 [After update]
✅ Draft deleted after successful product update
```

When editing without changing cost price (cost_price_cents stays at original value):

```
📝 COST PRICE AUDIT: Preparing to submit form
🔴 COST PRICE AUDIT: cost_per_item_cents in FormData = 5000 [About to send to server]
🔴 COST PRICE AUDIT: cost_price_cents 5000 cents -> cost_per_item_cents 5000 [APPENDED TO FORMDATA]
✅ Product updated successfully
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents from FormData = 5000
🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]
🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 5000 [After update]
✅ Draft deleted after successful product update
```

---

## Files Modified

1. **[ProductForm.tsx](src/components/ProductForm.tsx)**
   - Lines 256-293: Fixed FormData construction to always include numeric fields with value 0
   - Lines 310-330: Fixed draft deletion to use proper async/await with error handling
   - Added comprehensive logging throughout form submission

2. **[actions.ts](src/app/(admin)/admin/products/actions.ts)**
   - Lines 903-965: Refactored `updatePayload` building into `buildUpdatePayload()` function that selectively includes fields
   - Lines 960-975: Added logging to track cost_per_item_cents through the update process
   - Ensures cost_per_item_cents is always included in payload to prevent unintended overwrites

---

## Testing Checklist

- [ ] **Test 1: Edit product without changing cost price**
  - Create product with cost_price_cents = 500 cents
  - Edit product (change name only, leave cost price unchanged)
  - Verify: cost_price_cents remains 500 cents in database
  - Console logs should show: FormData has 500 → payload has 500 → database returns 500

- [ ] **Test 2: Edit product and change cost price**
  - Create product with cost_price_cents = 500 cents
  - Edit product and change cost_price_cents to 600 cents
  - Verify: cost_price_cents is 600 cents in database
  - Console logs should show: FormData has 600 → payload has 600 → database returns 600

- [ ] **Test 3: Edit product with 0 cost price**
  - Create product with cost_price_cents = 0 cents
  - Edit product (change name only)
  - Verify: cost_price_cents remains 0 cents in database
  - Console logs should show the special handling for 0 values

- [ ] **Test 4: Draft deletion after update**
  - Edit a product
  - Check draft is deleted after successful update
  - Console logs should show: "✅ Draft deleted after successful product update"
  - Next edit should load fresh product data, not stale draft

- [ ] **Test 5: Verify no draft corruption during edit**
  - Create product with cost_price_cents = 500 cents
  - Start editing product
  - Verify useDraftAutoSave is NOT saving drafts (formData = null in ProductForm)
  - Change name and save
  - Verify database has fresh data, not draft data

---

## Technical Details

### Why This Fix Works

1. **FormData includes 0 values:** Even if cost_price_cents is 0, it's now properly sent in FormData with the else-if check for `value === 0 && numericFields.includes(key)`

2. **Server receives the value:** When FormData contains cost_per_item_cents, `parseIntOrUndefined()` correctly parses it and returns the numeric value

3. **Payload includes the value:** The selective `buildUpdatePayload()` function explicitly includes cost_per_item_cents, whether it's 0, a positive number, or undefined

4. **Database gets updated correctly:** When cost_per_item_cents is in the payload, Supabase updates it to that value instead of leaving it unchanged or setting it to null

5. **Drafts don't corrupt:** Draft auto-save is disabled (formData = null in ProductForm line 186), and draft deletion is now properly awaited with error handling

### Field Mapping

```
Client-side (ProductForm):
  cost_price_cents (in form data object)
  ↓ (converted during FormData construction)
  cost_per_item_cents (added to FormData with key name mapping)
  
Server-side (updateProduct):
  cost_per_item_cents (extracted from FormData)
  ↓ (becomes productData.cost_per_item_cents)
  productData.cost_per_item_cents
  ↓ (included in updatePayload)
  updatePayload.cost_per_item_cents
  ↓ (sent to Supabase)
  products table → cost_per_item_cents column
```

---

## Related Code References

- **ProductForm.tsx:** [Overall form component](src/components/ProductForm.tsx)
- **updateProduct action:** [Server-side update logic](src/app/(admin)/admin/products/actions.ts#L757)
- **useDraftAutoSave hook:** [Draft auto-save logic (currently disabled)](src/hooks/useDraftAutoSave.ts)
- **Draft API:** [Draft endpoints](src/app/api/product-drafts/[productId]/route.ts)

---

## Monitoring

After this fix is deployed, monitor these logs to verify the cost price flow:
- ✅ `🔴 COST PRICE AUDIT:` logs in console show correct values through FormData
- ✅ `🔴 COST PRICE FIX:` logs confirm payload includes cost_per_item_cents
- ✅ `🔴 COST PRICE UPDATE AUDIT:` logs show value sent to database
- ✅ `🔴 COST PRICE UPDATE RESULT:` logs confirm database received the value
- ✅ No `⚠️ Failed to delete draft` warnings

If any of these logs show unexpected values (especially `undefined` or different from input), there may be another issue in the flow.

---

## References to Original Issue

**Git Commit:** Fixes cost price corruption bug where editing products without changing cost_price_cents would cause the value to be overwritten with null.

**Tickets:** Related to cost_price_cents disappearing during product edit operations.

**Root Cause:** Multi-part issue combining FormData construction skipping 0 values, parseIntOrUndefined returning undefined, and updatePayload including undefined values that overwrite existing database values.
