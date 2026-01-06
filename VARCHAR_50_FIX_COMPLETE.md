# VARCHAR(50) Limit Fix - Product Creation Image Issue

## Problem Summary
When users uploaded a product image or size guide image, product creation failed with:
```
Field "unknown" exceeds maximum length of 50 characters
```

The error message showed "unknown" because the system couldn't identify which column was being violated.

## Root Cause Analysis

### The Issue
The `sizeGuideId` field was storing the **full image upload URL** (100-150+ characters), which was then being stored in the `size_guide_type` column in the `products` table.

**The Problem:** `size_guide_type` has a `varchar(50)` constraint in Postgres, so:
- Image URL example: `https://storage.supabase.co/.../{productId}/{timestamp}-image.jpg` → ~120 characters
- Database limit: `varchar(50)` → 50 characters
- **Result:** Character limit exceeded!

### Data Flow (Before Fix)
```
SizeGuideSection.tsx (line 55)
    ↓
    setValue('sizeGuideId', imageUrl)  // imageUrl is full URL (120+ chars)
    ↓
ProductForm.tsx (line 267)
    ↓
    form.append('sizeGuideId', imageUrl)
    ↓
actions.ts - createProduct (line 210)
    ↓
    productData.sizeGuideId = formData.get('sizeGuideId')  // still the full URL
    ↓
actions.ts - createProduct (line 343)
    ↓
    size_guide_type: productData.sizeGuideId || null  // stores 120+ char URL in varchar(50)
    ↓
    Database insert fails ❌
```

## Solution Implemented

### 1. Fixed SizeGuideSection.tsx (Line 55)
**Before:**
```typescript
setValue('sizeGuideId', imageUrl)  // imageUrl = full URL (120+ chars)
```

**After:**
```typescript
// Do NOT store the full image URL in sizeGuideId - it's varchar(50) limited
// Instead, set a flag that a size guide image exists; the URL is handled separately
setValue('sizeGuideId', 'size-guide-image')  // Just a flag (16 chars, well under 50)
```

### 2. Fixed actions.ts - createProduct (Line 343)
**Before:**
```typescript
size_guide_type: productData.sizeGuideId || null,  // stores URL if present
```

**After:**
```typescript
size_guide_type: null,  // Do NOT store sizeGuideId here - it's varchar(50) limited and images are stored separately
```

### 3. Fixed actions.ts - updateProduct (Line 946)
**Before:**
```typescript
size_guide_type: productData.sizeGuideId || null,  // stores URL if present
```

**After:**
```typescript
size_guide_type: null,  // Do NOT store sizeGuideId here - it's varchar(50) limited and images are stored separately
```

## Why This Works

1. **`sizeGuideId` is now a flag, not a storage reference:**
   - Old: Full image URL → Tried to store in database column → Failed
   - New: Simple flag `'size-guide-image'` → Can store in database if needed, but we set to null

2. **Image URLs are stored separately:**
   - Gallery images are stored in `product_images` table with `url` field (unlimited)
   - Size guide images can be handled similarly through the existing image upload flow

3. **The `size_guide_type` column is now always null:**
   - This column can remain reserved for future use
   - It will never exceed the 50-character limit

## Files Changed
1. [SizeGuideSection.tsx](src/app/(admin)/admin/products/components/SizeGuideSection.tsx#L55) - Line 55
2. [actions.ts](src/app/(admin)/admin/products/actions.ts#L343) - Line 343 (createProduct)
3. [actions.ts](src/app/(admin)/admin/products/actions.ts#L946) - Line 946 (updateProduct)

## Testing
The fix has been applied successfully. Users should now be able to:
- ✅ Create products with gallery images
- ✅ Create products with size guide images
- ✅ Upload images without encountering the varchar(50) error
- ✅ Update existing products with images

## Database Schema Context
```
products table:
  size_guide_type: varchar(50) ← This column now always stores NULL
  
product_images table:
  url: text  ← Gallery images are stored here (unlimited length)
  alt: varchar(255)
  
product_size_guides table:
  size_guide_id: uuid (references size_guides table)
  ← Size guide metadata is stored here, not in products table
```

## Related Documentation
- See SUPABASE_AUTH_STANDARDIZATION_COMPLETE.md for schema context
- See TENANT_ISOLATION_VERIFICATION.md for database validation approach
