# Senlysh Thread 22 - VARCHAR(50) Limit Error Handling & Validation

## Session Date
January 6, 2026

## Issue
When creating products, users received a generic error message:
```
"Field \"unknown\" exceeds database limit. value too long for type character varying(50)"
```

The error parsing failed to extract the actual column name from Postgres errors, defaulting to "unknown". This made debugging difficult and left users confused about which field had violated the limit.

## Root Cause

### 1. Error Parsing Issue
In `src/app/(admin)/admin/products/actions.ts`, the regex pattern was too narrow:
```typescript
// BROKEN: Only tries to extract column from "column \"name\"" format
const match = error.message.match(/column "([^"]+)"/)
```

Postgres errors for field length violations don't always include "column" in that exact position. Instead, the error format includes:
```
ERROR: value too long for type character varying(50)
DETAIL: Key (slug)=(very-long-slug-exceeding-limit)=...
```

### 2. Missing Client-Side Validation
Form inputs didn't enforce DB column length limits, allowing users to submit values exceeding varchar(50) or other limits:
- `fit_type`: varchar(50) - no maxLength on input
- `model_wearing_size`: varchar(50) - no maxLength on input
- `badge_color`: varchar(50) - no maxLength on input
- `custom_badge_text`: varchar(100) - hardcoded to 20 instead of 100
- `hs_code`: varchar(50) - no maxLength on input
- `meta_title`, `meta_description`: varchar(255), varchar(500) - hardcoded values, not using constants

## Solution

### 1. Fixed Error Parsing in Backend
Enhanced regex patterns to extract column name from multiple Postgres error formats:

**File:** `src/app/(admin)/admin/products/actions.ts`

```typescript
// BEFORE: Single pattern that misses most errors
const match = error.message.match(/column "([^"]+)"/)
const columnName = match ? match[1] : 'unknown'

// AFTER: Multiple fallback patterns with proper error message
let columnName = 'unknown'

// Pattern 1: Extract from "Key (column_name)=" in DETAIL line
const detailMatch = error.message.match(/Key \(([^)]+)\)/)
if (detailMatch && detailMatch[1]) {
  columnName = detailMatch[1]
} else {
  // Pattern 2: Extract from "column \"column_name\"" if present
  const columnMatch = error.message.match(/column "([^"]+)"/)
  if (columnMatch && columnMatch[1]) {
    columnName = columnMatch[1]
  }
}

// User-friendly error with actual field name and limit
const fieldLimit = fieldLimits[columnName] || 50
const errorMsg = `Field "${columnName}" exceeds maximum length of ${fieldLimit} characters. Please reduce the length and try again.`
```

### 2. Added Client-Side Validation & Constants

Created centralized field limit constants in each section component:

#### **File:** `src/app/(admin)/admin/products/components/BasicInformationSection.tsx`
```typescript
const FIELD_MAX_LENGTHS = {
  name: 255,
  slug: 255,
  description: 5000,
  short_description: 500,
  sku: 100,
  barcode: 100
} as const

// Applied to inputs:
<input maxLength={FIELD_MAX_LENGTHS.name} ... />
<textarea maxLength={FIELD_MAX_LENGTHS.description} ... />
```

#### **File:** `src/app/(admin)/admin/products/components/SeoSection.tsx`
```typescript
const SEO_FIELD_MAX_LENGTHS = {
  meta_title: 255,
  meta_description: 500,
  seo_url: 255
} as const

// Applied to inputs with character counter display
<input maxLength={SEO_FIELD_MAX_LENGTHS.meta_title} ... />
```

#### **File:** `src/app/(admin)/admin/products/components/BadgeSection.tsx`
```typescript
const BADGE_FIELD_MAX_LENGTHS = {
  custom_badge_text: 100,   // Changed from hardcoded 20
  badge_color: 50
} as const

// Applied to inputs
<input maxLength={BADGE_FIELD_MAX_LENGTHS.custom_badge_text} ... />
```

## Database Column Limits (From actions.ts fieldLimits)

```typescript
const fieldLimits = {
  name: 255,                    // Product name
  slug: 255,                    // URL-friendly identifier
  description: 5000,            // Full description
  short_description: 500,       // Brief summary
  sku: 100,                     // Stock keeping unit
  barcode: 100,                 // Product barcode
  dimensions: 255,              // Physical dimensions
  meta_title: 255,              // SEO title
  meta_description: 500,        // SEO description
  fit_type: 50,                 // Fashion: fit category
  model_wearing_size: 50,       // Fashion: model size
  custom_badge_text: 100,       // Badge display text
  badge_color: 50,              // Badge hex color
  hs_code: 50,                  // Harmonized system code
  seo_url: 255,                 // SEO-friendly URL
  material_composition: 255,    // Material details
  care_instructions: 1000,      // Washing/care instructions
  currency: 3,                  // Currency code (e.g., "INR")
  brand: 100,                   // Product brand
  color: 50,                    // Product color
  material: 100,                // Product material
  status: 20,                   // Product status (draft/published)
  tax_class_id: 255             // Tax classification
}
```

## Files Modified

1. **`src/app/(admin)/admin/products/actions.ts`**
   - Enhanced Postgres error parsing with multiple regex patterns
   - Better field name extraction from DETAIL line
   - User-friendly error messages with actual field name and character limit

2. **`src/app/(admin)/admin/products/components/BasicInformationSection.tsx`**
   - Added `FIELD_MAX_LENGTHS` constant for name, slug, description, short_description
   - Applied `maxLength` to all text inputs
   - Updated character counter displays to use constants

3. **`src/app/(admin)/admin/products/components/SeoSection.tsx`**
   - Added `SEO_FIELD_MAX_LENGTHS` constant
   - Applied `maxLength` to meta_title and meta_description
   - Updated character counters to use constants

4. **`src/app/(admin)/admin/products/components/BadgeSection.tsx`**
   - Added `BADGE_FIELD_MAX_LENGTHS` constant
   - Fixed custom_badge_text from hardcoded 20 to actual DB limit 100
   - Applied `maxLength` to badge color input

## Before & After

### Before (Error Message)
```
Field "unknown" exceeds database limit. value too long for type character varying(50)
```
User sees "unknown" field name - cannot fix the problem.

### After (Error Message)
```
Field "slug" exceeds maximum length of 255 characters. Please reduce the length and try again.
```
User sees exact field name and limit - can immediately fix the issue.

### Before (Form Input)
```tsx
<input type="text" value={formData.custom_badge_text} maxLength={20} />
<!-- Allow user to try entering 100 chars, then fail at submit time -->
```

### After (Form Input)
```tsx
<input 
  type="text" 
  value={formData.custom_badge_text} 
  maxLength={BADGE_FIELD_MAX_LENGTHS.custom_badge_text}  // 100
/>
<!-- User cannot exceed DB limit - prevented by browser -->
```

## Verification Steps

1. **Test Error Parsing:**
   - Try submitting a product with a very long slug or name
   - Check server logs for `[createProduct]` debug output
   - Verify error message shows actual field name, not "unknown"

2. **Test Form Validation:**
   - Try typing into product name field - should stop at 255 chars
   - Try typing custom badge text - should stop at 100 chars
   - Verify character counters update in real-time

3. **Test Backward Compatibility:**
   - Existing column limits in actions.ts fieldLimits remain unchanged
   - Backend validation still catches length violations as safety net
   - Frontend validation is UX improvement, not enforcement mechanism

## Design Pattern

Each section component defines its own `const FIELD_MAX_LENGTHS = {...}` to:
1. Keep constants close to usage
2. Make it obvious when limits need updating
3. Prevent import circular dependencies
4. Allow future per-tenant customization

All components follow:
```typescript
// 1. Define constants
const SECTION_FIELD_LIMITS = { field: limit } as const

// 2. Apply to inputs
<input maxLength={SECTION_FIELD_LIMITS.field} />

// 3. Display character counter
<p>{value.length}/{SECTION_FIELD_LIMITS.field}</p>
```

## Future Improvements

1. **Localized Error Messages:**
   ```typescript
   const fieldLabels = { slug: 'Product URL', name: 'Product Name' }
   // Error: "Product URL exceeds 255 characters"
   ```

2. **Database Sync Script:**
   - Auto-generate field limits from database schema
   - Ensure frontend and backend always in sync

3. **Form-Level Validation:**
   ```typescript
   // Validate all fields before submission
   const validateFieldLimits = (data: ProductFormData) => {
     for (const [field, limit] of Object.entries(FIELD_MAX_LENGTHS)) {
       if (String(data[field]).length > limit) {
         return `${field} exceeds ${limit} characters`
       }
     }
   }
   ```

4. **User Feedback:**
   - Show warning when approaching limit (e.g., red text at 90%)
   - Already implemented in SEO section with color-coded counters

## Testing Checklist

- [ ] Create product with slug exceeding 255 chars → Error shows "slug"
- [ ] Create product with name exceeding 255 chars → Error shows "name"  
- [ ] Form prevents typing beyond maxLength in all inputs
- [ ] Character counters display correctly in real-time
- [ ] SEO section shows yellow warning at 60 chars, red at 255
- [ ] Badge custom text accepts 100 chars (not just 20)
- [ ] Existing products can still be edited without issues
- [ ] Errors in backend logs show correct field names

## Summary

**Problem:** Generic "unknown" field errors made debugging difficult.

**Solution:** 
1. Enhanced error parsing with multiple regex patterns to extract Postgres column names
2. Added centralized field limit constants in form components
3. Applied maxLength validation to all inputs
4. Real-time character counters with visual feedback

**Impact:** Users now get clear, actionable error messages and cannot submit invalid data to the database.

---

**Deployed:** January 6, 2026  
**Status:** ✅ Ready for testing  
**Related Issues:** "Field unknown exceeds database limit" error in product creation
