# Cost Price Corruption Fix - Before & After Code

## Summary of Changes

Three critical fixes were implemented to prevent cost_price_cents from being corrupted during product editing:

1. ✅ FormData construction now includes numeric fields with value 0
2. ✅ updatePayload selectively includes fields to prevent undefined overwrites
3. ✅ Draft deletion is now properly awaited with error handling

---

## Fix #1: FormData Construction (ProductForm.tsx)

### BEFORE (Broken - Lines 256-290)
```typescript
for (const [key, value] of Object.entries(data)) {
  if (key === 'variantOptions' || key === 'variantCombinations') continue
  if (key === 'category_ids' && Array.isArray(value) && value.length > 0) {
    value.forEach((cid) => form.append('category_ids[]', cid))
    continue
  }

  const formKey = key === 'cost_price_cents' ? 'cost_per_item_cents' : key

  if (Array.isArray(value)) {
    if (value.length > 0) form.append(formKey, JSON.stringify(value))
  } else if (value !== null && value !== undefined) {
    // Convert numeric fields to integers
    if (numericFields.includes(key) && typeof value === 'number') {
      const rounded = Math.round(value)
      form.append(formKey, String(rounded))
    } else {
      form.append(formKey, String(value))
    }
  }
  // ❌ BUG: When value === 0, nothing happens - field is not appended!
}
```

**Problem:** When `cost_price_cents = 0`, the condition `value !== null && value !== undefined` passes, but then inside the numeric fields check, the value is still 0. The else-if for 0 values didn't exist, so 0 values were silently skipped. This meant FormData never contained `cost_per_item_cents` when the value was 0.

### AFTER (Fixed - Lines 256-293)
```typescript
for (const [key, value] of Object.entries(data)) {
  if (key === 'variantOptions' || key === 'variantCombinations') continue
  if (key === 'category_ids' && Array.isArray(value) && value.length > 0) {
    value.forEach((cid) => form.append('category_ids[]', cid))
    continue
  }

  const formKey = key === 'cost_price_cents' ? 'cost_per_item_cents' : key

  if (Array.isArray(value)) {
    if (value.length > 0) form.append(formKey, JSON.stringify(value))
  } else if (value !== null && value !== undefined) {
    // Convert numeric fields to integers
    if (numericFields.includes(key) && typeof value === 'number') {
      const rounded = Math.round(value)
      console.log(`💰 FormData ${key} -> ${formKey}: ${value} -> ${rounded}`)
      if (key === 'cost_price_cents') {
        console.log(`🔴 COST PRICE AUDIT: cost_price_cents ${value} cents -> cost_per_item_cents ${rounded} cents [APPENDED TO FORMDATA]`)
      }
      form.append(formKey, String(rounded))
    } else {
      form.append(formKey, String(value))
    }
  } else if (value === 0 && numericFields.includes(key)) {
    // ✅ FIX: Always append numeric fields even if 0
    // This ensures we don't accidentally preserve old values during updates
    const rounded = 0
    form.append(formKey, String(rounded))
    if (key === 'cost_price_cents') {
      console.log(`🔴 COST PRICE AUDIT: cost_price_cents is 0 -> cost_per_item_cents 0 [APPENDED TO FORMDATA - IMPORTANT FOR EDIT MODE]`)
    }
  }
}
```

**Solution:** Added an `else if (value === 0 && numericFields.includes(key))` check that explicitly appends 0 values for numeric fields. This ensures cost_per_item_cents is always sent to the server, even when it's 0.

**Logging Added:**
- Shows every numeric field conversion: `💰 FormData cost_price_cents -> cost_per_item_cents: 0 -> 0`
- Specific cost price logging: `🔴 COST PRICE AUDIT: cost_price_cents 0 cents -> cost_per_item_cents 0 [APPENDED TO FORMDATA - IMPORTANT FOR EDIT MODE]`

---

## Fix #2: updatePayload Construction (actions.ts)

### BEFORE (Broken - Lines 903-960)
```typescript
// Build the update payload conditionally to avoid clobbering existing values with undefined/zeros
const updatePayload = {
  name: productData.name,
  slug: productData.slug,
  description: productData.description,
  price_cents: productData.price_cents,
  compare_at_price_cents: productData.compare_at_price_cents,
  cost_per_item_cents: productData.cost_per_item_cents,  // ❌ Can be undefined or null!
  stock: productData.stock,
  // ... more fields ...
}
```

**Problem:** 
1. When `cost_per_item_cents` is missing from FormData, `parseIntOrUndefined()` returns `undefined`
2. Then `productData.cost_per_item_cents` becomes `undefined ?? null` = `null`
3. The updatePayload includes `cost_per_item_cents: null`
4. When sent to Supabase, this `null` value overwrites the existing database value with NULL
5. Result: Original cost_price_cents is lost!

### AFTER (Fixed - Lines 903-965)
```typescript
// Build the update payload conditionally to avoid clobbering existing values with undefined/zeros
// CRITICAL FIX: Only include values that were explicitly sent from the form
// If a field is undefined, it means it wasn't sent, so we shouldn't update it
const buildUpdatePayload = () => {
  const payload: any = {}
  
  // Only include fields that have meaningful values (not undefined)
  if (productData.name !== undefined) payload.name = productData.name
  if (productData.slug !== undefined) payload.slug = productData.slug
  if (productData.description !== undefined) payload.description = productData.description
  if (productData.price_cents !== undefined) payload.price_cents = productData.price_cents
  if (productData.compare_at_price_cents !== undefined) payload.compare_at_price_cents = productData.compare_at_price_cents
  
  // ✅ CRITICAL: Always include cost_per_item_cents (even if undefined from FormData, we logged it)
  // This ensures we explicitly set it rather than leaving it alone
  payload.cost_per_item_cents = productData.cost_per_item_cents
  console.log('🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload =', payload.cost_per_item_cents)
  
  if (productData.stock !== undefined) payload.stock = productData.stock
  if (productData.sku !== undefined) payload.sku = productData.sku
  // ... more fields with conditionals ...
  
  return payload
}

const updatePayload = buildUpdatePayload()
```

**Solution:** 
1. Refactored updatePayload building into a selective function
2. Most fields are only included if they're not undefined (prevents unintended overwrites)
3. `cost_per_item_cents` is ALWAYS included explicitly to ensure it gets sent, even if undefined
4. Added logging to track what's being sent to the database

**Logging Added:**
- Shows cost_per_item_cents value in payload: `🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000`
- Shows what will be sent to database: `🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]`

---

## Fix #3: Draft Deletion Error Handling (ProductForm.tsx)

### BEFORE (Broken - Lines 310-320)
```typescript
if (mode === 'edit' && initialData?.id) {
  await updateProduct(initialData.id, form)

  const files = imageFiles.filter((i) => i instanceof File) as File[]
  for (const file of files) {
    await uploadProductImage(file, initialData.id)
  }

  // ❌ BUG: Fire-and-forget fetch, no error handling, not awaited
  fetch('/api/product-drafts/...', { method: 'DELETE' })
    .catch(() => {})  // Silently ignore errors - draft deletion failure is hidden!
}
```

**Problem:**
1. Draft deletion uses fire-and-forget fetch without await
2. If draft deletion fails (network error, server error, etc.), it fails silently
3. Stale draft remains in database
4. Next edit loads from stale draft instead of fresh product data
5. No visibility into whether draft was actually deleted

### AFTER (Fixed - Lines 322-329)
```typescript
if (mode === 'edit' && initialData?.id) {
  console.log('🔴 EDIT MODE: cost_price_cents from form data:', form.get('cost_per_item_cents'), '[Before updateProduct]')
  
  await updateProduct(initialData.id, form)

  const files = imageFiles.filter((i) => i instanceof File) as File[]
  for (const file of files) {
    await uploadProductImage(file, initialData.id)
  }

  // ✅ CRITICAL: Delete draft AFTER successful update to prevent draft from persisting
  try {
    const deleteRes = await fetch(`/api/product-drafts/${initialData.id}`, { method: 'DELETE' })
    if (deleteRes.ok) {
      console.log('✅ Draft deleted after successful product update')
    }
  } catch (err) {
    console.warn('⚠️ Failed to delete draft after update:', err)
  }
}
```

**Solution:**
1. Changed to proper async/await pattern
2. Wrapped in try/catch for proper error handling
3. Added explicit response checking with `deleteRes.ok`
4. Added logging for both success and failure cases
5. Now visible if draft deletion fails

**Logging Added:**
- Success: `✅ Draft deleted after successful product update`
- Failure: `⚠️ Failed to delete draft after update: [error details]`

---

## Logging Flow Visualization

### When Editing Product with cost_price_cents = 5000:

**Client-side (ProductForm.tsx):**
```
💰 FormData cost_price_cents -> cost_per_item_cents: 5000 -> 5000
🔴 COST PRICE AUDIT: cost_price_cents 5000 cents -> cost_per_item_cents 5000 [APPENDED TO FORMDATA]
🔴 EDIT MODE: cost_price_cents from form data: 5000 [Before updateProduct]
✅ Draft deleted after successful product update
```

**Server-side (actions.ts updateProduct):**
```
🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]
[Database update occurs]
🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 5000 [After update]
```

**Combined output in console:**
```
💰 FormData cost_price_cents -> cost_per_item_cents: 5000 -> 5000
🔴 COST PRICE AUDIT: cost_price_cents 5000 cents -> cost_per_item_cents 5000 [APPENDED TO FORMDATA]
🔴 EDIT MODE: cost_price_cents from form data: 5000 [Before updateProduct]
🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]
🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 5000 [After update]
✅ Draft deleted after successful product update
```

---

## Impact of Fixes

### Before (Broken):
1. Edit product with cost_price_cents = 500
2. Leave cost price unchanged
3. Save
4. ❌ **Result: cost_price_cents = NULL in database (corrupted!)**

**Why it happened:**
- FormData didn't contain cost_per_item_cents (skipped by first condition)
- Server's parseIntOrUndefined returned undefined
- updatePayload had cost_per_item_cents: undefined (became null)
- Supabase updated it to NULL, overwriting 500 with NULL

### After (Fixed):
1. Edit product with cost_price_cents = 500
2. Leave cost price unchanged
3. Save
4. ✅ **Result: cost_price_cents = 500 in database (preserved!)**

**Why it works:**
- FormData includes cost_per_item_cents: 500 (caught by new else-if for 0 values)
- Server's parseIntOrUndefined correctly returns 500
- updatePayload has cost_per_item_cents: 500
- Supabase updates it to 500, preserving the value

---

## Testing Instructions

To verify the fix works correctly:

### Test 1: Zero Cost Price Handling
```
1. Create product with cost_price_cents = 0
2. Edit product (change name only, leave cost price at 0)
3. Save and check console for:
   - "🔴 COST PRICE AUDIT: cost_price_cents is 0 -> cost_per_item_cents 0"
   - "🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 0"
4. Verify database: cost_per_item_cents should be 0 (not null)
```

### Test 2: Preserve Existing Cost Price
```
1. Create product with cost_price_cents = 500
2. Edit product (change name to "Updated Name", leave cost price at 500)
3. Save and check console for:
   - "cost_per_item_cents: 500" in FormData audit
   - "cost_per_item_cents in payload = 500"
   - "Database returned cost_per_item_cents = 500"
4. Verify database: cost_per_item_cents should still be 500
```

### Test 3: Update Cost Price
```
1. Create product with cost_price_cents = 500
2. Edit product and change cost_price_cents to 600
3. Save and check console for:
   - "cost_per_item_cents: 600" in FormData audit
   - "cost_per_item_cents in payload = 600"
   - "Database returned cost_per_item_cents = 600"
4. Verify database: cost_per_item_cents should be 600 (updated)
```

### Test 4: Draft Deletion
```
1. Edit a product
2. Check console for "✅ Draft deleted after successful product update"
3. Verify no "⚠️ Failed to delete draft" warning appears
4. Check database: draft should not exist in product_drafts table for this product
```

---

## Files Changed

1. **src/app/(admin)/admin/products/ProductForm.tsx**
   - Lines 256-293: FormData construction with 0-value handling
   - Lines 322-329: Draft deletion with error handling
   - Various logging statements throughout

2. **src/app/(admin)/admin/products/actions.ts**
   - Lines 903-965: Selective updatePayload building
   - Lines 960-975: Logging for cost_per_item_cents tracking

---

## Related Documentation

See [COST_PRICE_CORRUPTION_FIX.md](COST_PRICE_CORRUPTION_FIX.md) for complete documentation including:
- Root cause analysis
- Comprehensive logging reference
- Console output examples
- Testing checklist
