# Quick Reference: Admin vs Tenant-Admin Edit Pages (After Fix)

## Side-by-Side Comparison

### Attribute Selection Query

| Admin Edit Page | Tenant-Admin Edit Page |
|---|---|
| ✅ **HAD** this query | ❌ **WAS MISSING** (NOW FIXED) |
| `product_attribute_values` table | Now also queries `product_attribute_values` |
| Selects `attribute_value_id, attribute_values(attribute_id)` | Same query ✓ |
| Filters by `product_id` and `tenant_id` | Same filters ✓ |
| Stores in `attributeSelectionsResult` | Same variable name ✓ |

### Attribute Selection Mapping

| Admin Edit Page | Tenant-Admin Edit Page |
|---|---|
| ✅ **HAD** this logic | ❌ **WAS MISSING** (NOW FIXED) |
| `attributeSelectionMap = new Map()` | Now has this ✓ |
| Loops through results and groups by attribute | Same logic ✓ |
| Builds `attributeSelections` array | Same format ✓ |
| Each item: `{ attributeId, valueIds }` | Same structure ✓ |

### FormData Object

| Admin Edit Page | Tenant-Admin Edit Page |
|---|---|
| ✅ **HAD** attributes | ❌ **WAS MISSING** (NOW FIXED) |
| `attributes: attributeSelections` | Now included ✓ |
| Passed to ProductForm | Same result ✓ |

---

## Code Snippet Comparison

### ADMIN EDIT PAGE (Working)
```typescript
// Line 35 - 5 queries in Promise.all
const [
  categoriesResult, 
  imagesResult, 
  variantOptionsResult, 
  variantsResult, 
  attributeSelectionsResult  // ← HAS THIS
] = await Promise.all([
  // ... 5 queries including product_attribute_values
])

// Line 197-207 - Builds attributeSelections
const attributeSelectionMap = new Map<string, string[]>()
;(attributeSelectionsResult.data || []).forEach((row: any) => {
  const attributeId = row?.attribute_values?.attribute_id
  const valueId = row?.attribute_value_id
  if (!attributeId || !valueId) return
  const existing = attributeSelectionMap.get(attributeId) || []
  attributeSelectionMap.set(attributeId, existing.concat(valueId))
})
const attributeSelections = Array.from(attributeSelectionMap.entries()).map(
  ([attributeId, valueIds]) => ({ attributeId, valueIds })
)

// Line 313 - Passes to form
const formData = {
  // ... other fields ...
  attributes: attributeSelections  // ← INCLUDES THIS
}
```

### TENANT-ADMIN EDIT PAGE (After Fix)
```typescript
// Line 33 - NOW HAS 5 queries (was 4)
const [
  categoriesResult, 
  imagesResult, 
  variantOptionsResult, 
  variantsResult, 
  attributeSelectionsResult  // ← NOW ADDED
] = await Promise.all([
  // ... now includes product_attribute_values query
])

// Lines 195-202 - NOW HAS attributeSelections building
const attributeSelectionMap = new Map<string, string[]>()
;(attributeSelectionsResult.data || []).forEach((row: any) => {
  const attributeId = row?.attribute_values?.attribute_id
  const valueId = row?.attribute_value_id
  if (!attributeId || !valueId) return
  const existing = attributeSelectionMap.get(attributeId) || []
  attributeSelectionMap.set(attributeId, existing.concat(valueId))
})
const attributeSelections = Array.from(attributeSelectionMap.entries()).map(
  ([attributeId, valueIds]) => ({ attributeId, valueIds })
)

// Line 294 - NOW INCLUDES in form
const formData = {
  // ... other fields ...
  attributes: attributeSelections  // ← NOW ADDED
}
```

---

## What Changed

### Before Fix ❌
```
Edit Page Loads
   ↓
Fetch: categories, images, variant_options, variants
   ↓
[MISSING] Fetch attribute selections
   ↓
ProductForm initializes
   ↓
initialData.attributes = [] ← EMPTY!
   ↓
Form shows all unchecked checkboxes
   ↓
User confused!
```

### After Fix ✅
```
Edit Page Loads
   ↓
Fetch: categories, images, variant_options, variants, attributes
   ↓
Build attributeSelections from database
   ↓
ProductForm initializes
   ↓
initialData.attributes = [{ attributeId: "x", valueIds: ["y", "z"] }]
   ↓
Form shows checked checkboxes for saved selections
   ↓
User happy!
```

---

## Why This Happened

### Root Cause
The tenant-admin edit page was a newer implementation that:
- ✓ Correctly handles variants
- ✓ Correctly handles images and categories  
- ✗ **Accidentally omitted** the attribute selection query

### Why It Wasn't Caught
- The admin edit page (old routing) still had the query, so locally worked fine
- Production uses tenant-admin routing, so the bug only appeared there
- No TypeScript error (optional attributes field)
- Only affects edit mode (attributes empty), not submission (attributes parsed fresh)

---

## Files Involved

### Modified Files
- `src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx` ← **FIXED**

### Reference Files (Already Working)
- `src/app/(admin)/admin/products/[id]/edit/page.tsx` ← Pattern copied from here
- `src/app/(admin)/admin/products/ProductForm.tsx` ← Form sync logic
- `src/app/(admin)/admin/products/components/AttributesSection.tsx` ← Form rendering
- `src/app/(admin)/admin/products/actions.ts` ← Save logic

---

## Verification

### Quick Check - Are Both Pages Now Aligned?

**File 1: Admin Edit Page (Expected Pattern)**
```bash
grep -n "attributeSelectionsResult" src/app/(admin)/admin/products/[id]/edit/page.tsx
# Should show: appears ~3 times (Promise.all, data access, building selections)
```

**File 2: Tenant-Admin Edit Page (Should Match)**
```bash
grep -n "attributeSelectionsResult" "src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx"
# Should show: appears ~3 times AFTER FIX (same as admin)
```

**File 1: Admin Form Data**
```bash
grep -n "attributes: attributeSelections" src/app/(admin)/admin/products/[id]/edit/page.tsx
# Should find it
```

**File 2: Tenant-Admin Form Data**
```bash
grep -n "attributes: attributeSelections" "src/app/(tenant-admin)/[tenant]/admin/products/[id]/edit/page.tsx"
# Should find it (after fix)
```

If all grep commands show matches, both files are now properly aligned.

---

## Testing Matrix

| Test Case | Scope | Expected | Status |
|---|---|---|---|
| Create product with attributes | Both pages | Saves correctly | ✓ Should work |
| Edit with admin routing | Admin page | Shows saved attributes | ✓ Already worked |
| Edit with tenant-admin routing | Tenant-admin page | Shows saved attributes | ✓ **NOW FIXED** |
| Multiple edits | Both pages | Values persist | ✓ Should work |
| Change attributes on edit | Both pages | Updates correctly | ✓ Should work |
| Delete product | Both pages | No errors | ✓ Unaffected |
| Bulk operations | Both pages | Attributes preserved | ✓ Unaffected |

---

## Deployment Notes

- **Breaking Change**: No
- **Data Migration**: No
- **Database Changes**: No
- **Cache Invalidation**: Not required
- **Rollback Plan**: Simple - revert the 3 changes to the edit page
- **Testing Required**: Edit product with attributes
- **Performance Impact**: Negligible (1 additional DB query on product edit only)

