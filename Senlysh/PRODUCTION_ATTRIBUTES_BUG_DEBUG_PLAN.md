# Production Attributes Bug - Complete Debug & Fix Plan

## Executive Summary

**The Problem**: In production, when editing a product, attributes are NOT populated with previously selected values. Form shows empty checkboxes even though attributes were saved during creation.

**Works Locally But Fails in Prod**: This indicates a **data fetching/initialization issue**, not a UI bug.

**Root Cause Identified**: The tenant-admin edit page (`(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx`) does NOT fetch attribute selections from the database, while the admin edit page DOES.

---

## Root Cause Analysis

### Where the Bug Is

**File 1**: `src/app/(admin)/admin/products/[id]/edit/page.tsx` ✅ **CORRECT**
- Lines 35-75: Fetches attribute selections from `product_attribute_values` table
- Lines 197-207: Transforms them into `attributeSelections` array
- Line 313: Passes `attributes: attributeSelections` to ProductForm

```typescript
// Lines 35, 62-75 (ADMIN EDIT PAGE - WORKS)
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult, attributeSelectionsResult] = await Promise.all([
  // ... other queries ...
  
  // Attribute selections (multiple values per attribute) ← CRITICAL QUERY
  supabaseAdmin
    .from('product_attribute_values')
    .select('attribute_value_id, attribute_values(attribute_id)')
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
])

// Lines 197-207 (BUILDING ATTRIBUTE SELECTIONS)
const attributeSelectionMap = new Map<string, string[]>()
;(attributeSelectionsResult.data || []).forEach((row: any) => {
  const attributeId = row?.attribute_values?.attribute_id as string | undefined
  const valueId = row?.attribute_value_id as string | undefined
  if (!attributeId || !valueId) return
  const existing = attributeSelectionMap.get(attributeId) || []
  attributeSelectionMap.set(attributeId, existing.concat(valueId))
})
const attributeSelections = Array.from(attributeSelectionMap.entries()).map(([attributeId, valueIds]) => ({
  attributeId,
  valueIds
}))

// Line 313 (PASSING TO FORM)
attributes: attributeSelections,  // ✅ This is passed to ProductForm initialData
```

**File 2**: `src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx` ❌ **MISSING ATTRIBUTE QUERY**
- Does NOT have the `attributeSelectionsResult` query
- Does NOT build `attributeSelections` 
- The formData object is missing this critical data
- Form initializes with `attributes: []` (empty array)

```typescript
// Lines 28-65 (TENANT-ADMIN EDIT PAGE - MISSING THE QUERY)
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult] = await Promise.all([
  // ← NOTICE: NO attributeSelectionsResult query!
  // ... other queries ...
])

// Later in formData (around line 265)
// NO attributes: attributeSelections property!
// The formData is missing attributes entirely
```

### Why This Causes the Bug

1. **Edit Page Loads** → Server fetches product data
2. **AttributeSelections NOT Fetched** → Query missing on tenant-admin page
3. **ProductForm Mounts** with `initialData.attributes = []`
4. **Form Initializes** with empty attributes
5. **AttributesSection Renders** → Shows attribute definitions but NO selected values
6. **User Sees** → Unchecked checkboxes for all attributes
7. **User Confusion** → "Why are my attributes empty?"

### Why It Works Locally

Local likely uses the `(admin)` route structure, which has the query. Production likely uses `(tenant-admin)` which doesn't.

---

## Step-by-Step Detection & Debugging

### Step 1: Determine Which Route is Used in Production

Check your Next.js routing structure:

```bash
check which routes your production app uses:
- GET /admin/products/:id/edit → Uses (admin) path
- GET /[tenant]/admin/products/:id/edit → Uses (tenant-admin) path
```

**How to Check Logs in Production**:
- Look for console logs in the edit page
- Search for: `"Fetched attributes for edit product form"`
- If you see different routing patterns, that's your issue

### Step 2: Log the Full initialData Payload

**File**: `src/app/(admin)/admin/products/ProductForm.tsx`  
**Line**: ~156 (in the useEffect sync)

You already have logging here:
```typescript
console.log('📋 initialData received:', {
  id: initialData.id,
  name: initialData.name,
  images_count: initialData.images?.length || 0,
  attributes_count: initialData.attributes?.length || 0,  // ← Watch this value
  description_length: initialData.description?.length || 0,
  category_ids: initialData.category_ids,
})
```

**In Production Browser Console**:
- Open DevTools → Console
- Edit a product that definitely has attributes
- Look for: `📋 initialData received:`
- Check if `attributes_count` is **0** or shows the actual count

If `attributes_count: 0`, the data was never fetched from the database.

### Step 3: Compare Edit Page Queries

**In tenant-admin edit page** (Lines 28-68):
```typescript
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult] = await Promise.all([
  // ← Only 4 queries
])
```

**In admin edit page** (Lines 35-75):
```typescript
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult, attributeSelectionsResult] = await Promise.all([
  // ← 5 queries (missing attributeSelectionsResult on tenant-admin)
])
```

### Step 4: Database Query Check

If you need to manually verify data exists:

```sql
-- Check if this product has attribute selections in the database
SELECT *
FROM product_attribute_values
WHERE product_id = 'YOUR_PRODUCT_ID'
AND tenant_id = 'YOUR_TENANT_ID'
LIMIT 10;
```

If this returns rows and the form shows nothing, the issue is **definitely** the missing query.

---

## The Fix

### Solution: Add Attribute Selection Query to Tenant-Admin Edit Page

**File**: `src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx`

#### Change 1: Add attributeSelectionsResult to Promise.all (Lines 28-65)

**BEFORE**:
```typescript
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult] = await Promise.all([
  // Categories
  supabaseAdmin.from('product_categories').select(...),
  
  // Images  
  supabaseAdmin.from('product_images').select(...),
  
  // Variant options
  supabaseAdmin.from('product_variant_options').select(...),
  
  // Product variants
  supabaseAdmin.from('product_variants').select(...)
])
```

**AFTER**:
```typescript
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult, attributeSelectionsResult] = await Promise.all([
  // Categories
  supabaseAdmin.from('product_categories').select(...),
  
  // Images  
  supabaseAdmin.from('product_images').select(...),
  
  // Variant options
  supabaseAdmin.from('product_variant_options').select(...),
  
  // Product variants
  supabaseAdmin.from('product_variants').select(...),
  
  // Attribute selections (multiple values per attribute) ← ADD THIS
  supabaseAdmin
    .from('product_attribute_values')
    .select('attribute_value_id, attribute_values(attribute_id)')
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
])
```

#### Change 2: Build attributeSelections (Add after line 200, before formData construction)

**ADD THIS CODE** (after you transform variantOptions/variantCombinations):

```typescript
// Gather attribute selections grouped by attribute
const attributeSelectionMap = new Map<string, string[]>()
;(attributeSelectionsResult.data || []).forEach((row: any) => {
  const attributeId = row?.attribute_values?.attribute_id as string | undefined
  const valueId = row?.attribute_value_id as string | undefined
  if (!attributeId || !valueId) return
  const existing = attributeSelectionMap.get(attributeId) || []
  attributeSelectionMap.set(attributeId, existing.concat(valueId))
})
const attributeSelections = Array.from(attributeSelectionMap.entries()).map(([attributeId, valueIds]) => ({
  attributeId,
  valueIds
}))

console.log('✅ Attribute selections loaded:', attributeSelections)
```

#### Change 3: Add attributes to formData (Around line 265)

In the formData object construction, add the attributes field:

**BEFORE**:
```typescript
const formData = {
  id: productWithRelations.id,
  name: productWithRelations.name,
  // ... other fields ...
  badge_display_from: ''  // ← Last field before closing brace
}
```

**AFTER**:
```typescript
const formData = {
  id: productWithRelations.id,
  name: productWithRelations.name,
  // ... other fields ...
  badge_display_from: '',
  attributes: attributeSelections  // ← ADD THIS LINE
}
```

---

## Complete Fixed Code Block

Here's the exact code section to replace in `src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx`:

**Location**: Around lines 28-265 (Promise.all + attributeSelections building + formData)

```typescript
// ========== CHANGE 1: Add attributeSelectionsResult to Promise.all ==========
const [categoriesResult, imagesResult, variantOptionsResult, variantsResult, attributeSelectionsResult] = await Promise.all([
  // Categories
  supabaseAdmin
    .from('product_categories')
    .select('category:categories(id, name, slug)')
    .eq('product_id', id),
  
  // Images  
  supabaseAdmin
    .from('product_images')
    .select('url, alt, sort_order')
    .eq('product_id', id)
    .order('sort_order'),
  
  // Variant options
  supabaseAdmin
    .from('product_variant_options')
    .select(`
      option:variant_options(
        id,
        name,
        display_name,
        type,
        required
      )
    `)
    .eq('product_id', id),
  
  // Product variants
  supabaseAdmin
    .from('product_variants')
    .select('id, name, sku, price_cents, stock, attributes')
    .eq('product_id', id),
    
  // ADDED: Attribute selections (multiple values per attribute)
  supabaseAdmin
    .from('product_attribute_values')
    .select('attribute_value_id, attribute_values(attribute_id)')
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
])

// ... existing variant option/combination transformation code ...

// ========== CHANGE 2: Add attribute selections building ==========
// BUILD ATTRIBUTE SELECTIONS MAP
const attributeSelectionMap = new Map<string, string[]>()
;(attributeSelectionsResult.data || []).forEach((row: any) => {
  const attributeId = row?.attribute_values?.attribute_id as string | undefined
  const valueId = row?.attribute_value_id as string | undefined
  if (!attributeId || !valueId) return
  const existing = attributeSelectionMap.get(attributeId) || []
  attributeSelectionMap.set(attributeId, existing.concat(valueId))
})
const attributeSelections = Array.from(attributeSelectionMap.entries()).map(([attributeId, valueIds]) => ({
  attributeId,
  valueIds
}))

console.log('✅ Attribute selections loaded:', attributeSelections)

// ... then in formData construction ...

// ========== CHANGE 3: Add to formData object ==========
const formData = {
  id: productWithRelations.id,
  name: productWithRelations.name,
  slug: productWithRelations.slug,
  description: productWithRelations.description || '',
  status: productWithRelations.status,
  // ... all other fields as before ...
  badge_display_from: '',
  attributes: attributeSelections  // ← ADD THIS LINE
}
```

---

## Verification Checklist

After applying the fix:

### ✅ Verification Step 1: Code Review
- [ ] The `attributeSelectionsResult` query is in the Promise.all
- [ ] The attributeSelectionMap/attributeSelections code is present
- [ ] The `attributes: attributeSelections` line is in formData
- [ ] No syntax errors in the file

### ✅ Verification Step 2: Local Testing
```bash
cd /path/to/web
npm run dev
# Navigate to edit a product with attributes
# Open DevTools console
# Check: 📋 initialData received should show attributes_count > 0
# Check: Attribute checkboxes should be checked
```

### ✅ Verification Step 3: Inspect Form State
In browser DevTools Console, when editing:
```javascript
// Check if attributes are loaded
console.log(document.querySelector('form')?.attributes)  // Should show attributes

// Or inspect via React DevTools plugin
// Look for ProductForm → find "attributes" in props
```

### ✅ Verification Step 4: Database Verification
Verify the data exists:
```sql
SELECT COUNT(*) as selection_count
FROM product_attribute_values
WHERE product_id = 'A_KNOWN_PRODUCT_ID'
AND tenant_id = 'YOUR_TENANT_ID';
-- Should return > 0 if product has attributes
```

---

## Expected Behavior After Fix

| Step | Before Fix | After Fix |
|------|-----------|-----------|
| 1. User clicks "Edit" on product | ✓ | ✓ |
| 2. Edit page loads | ✓ | ✓ |
| 3. Server fetches product data | ✓ | ✓ |
| 4. Server fetches attributes | ✗ MISSING | ✓ FETCHED |
| 5. ProductForm mounts | ✓ | ✓ |
| 6. initialData has attributes | ✗ Empty | ✓ Populated |
| 7. Form syncs with initialData | Syncs [blank] | Syncs [with values] |
| 8. AttributesSection renders | ✗ Unchecked | ✓ Checked |
| 9. User sees saved attributes | ✗ NO | ✓ YES |

---

## Alternative Debugging Approaches

### If the fix doesn't work, check:

1. **RLS Policies**: Does the tenant have permission to read `product_attribute_values`?
   ```sql
   SELECT * FROM product_attribute_values 
   WHERE product_id = 'YOUR_ID'
   LIMIT 1;
   ```

2. **Data Migration**: Were attributes properly migrated to the database?
   ```sql
   SELECT COUNT(*) FROM product_attribute_values;
   -- Should show > 0 if attributes exist
   ```

3. **Tenant ID Mismatch**: Is the tenant_id filter working correctly?
   ```
   Add logging to see what tenant_id is being used
   ```

4. **Form Reset Issue**: Is the form sync useEffect actually running?
   ```typescript
   // In ProductForm.tsx useEffect, check:
   console.log('Syncing with initialData:', initialData)
   ```

---

## Summary of Changes Required

| File | Lines | Change | Why |
|------|-------|--------|-----|
| `(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx` | 28-65 | Add `attributeSelectionsResult` to Promise.all | Fetch attribute selections |
| Same | ~200 | Add attributeSelectionMap/attributeSelections building | Transform DB data to form format |
| Same | ~265 | Add `attributes: attributeSelections` to formData | Pass data to ProductForm |

**Total Changes**: 3 specific modifications to 1 file
**Effort**: Low (copy-paste from working admin edit page)
**Risk**: Minimal (identical pattern to tested code)
**Testing**: High confidence (existing code already validated this approach)

---

## Related Files for Understanding

- `src/app/(admin)/admin/products/[id]/edit/page.tsx` ← Reference implementation (working)
- `src/app/(admin)/admin/products/ProductForm.tsx` ← Form component (Lines 138-240 show sync logic)
- `src/app/(admin)/admin/products/components/AttributesSection.tsx` ← Attributes renderer
- `src/app/(admin)/admin/products/actions.ts` ← Server-side attribute save logic (Lines 471-505)
- `src/types/product.ts` ← Type definitions for AttributeSelection

