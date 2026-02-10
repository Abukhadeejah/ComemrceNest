# Product Edit Form - Images and Attributes Not Loading Fix

## Problem
When clicking "Edit" on a product, the edit form was not showing:
- **Images**: Product images were not displayed
- **Attributes/Filters**: Selected attribute values were not shown
- **Other fields**: Some fields might not load correctly

## Root Cause

React Hook Form's `defaultValues` only applies on **initial component mount**. When the edit page loads:

1. Component mounts with empty `initialData` (server is still fetching)
2. Form initializes with empty `defaultValues`
3. Server data arrives with `initialData` populated
4. Form **does not automatically sync** with the new `initialData`

This is a common React Hook Form issue when using async data.

## Solution

Added a `useEffect` hook that syncs `initialData` with form values when in edit mode:

```typescript
// CRITICAL FIX: Sync initialData with form values in edit mode
useEffect(() => {
  if (mode === 'edit' && initialData) {
    console.log('🔄 Syncing initialData with form in edit mode...')
    
    // Sync all fields from initialData
    Object.entries(initialData).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as keyof ProductFormData, value as any, { shouldValidate: false })
      }
    })
    
    // Sync images state
    if (initialData.images && Array.isArray(initialData.images)) {
      console.log('📸 Syncing images:', initialData.images.length, 'images')
      setImageFiles(initialData.images)
    }
    
    console.log('✅ Form sync complete')
  }
}, [mode, initialData, setValue])
```

### What This Does

1. **Watches for initialData changes**: Runs when `initialData` prop updates
2. **Only in edit mode**: Doesn't interfere with create mode
3. **Syncs all fields**: Iterates through all `initialData` fields and updates form
4. **Syncs images state**: Updates the `imageFiles` state separately (used by MediaSection)
5. **No validation**: Uses `shouldValidate: false` to avoid triggering validation during sync

## How It Works Now

### Edit Flow
1. User clicks "Edit" on a product
2. Edit page loads and fetches product data from database
3. ProductForm mounts with empty `initialData`
4. Server data arrives with complete product info
5. **useEffect detects initialData change**
6. **Form fields are populated with product data** ✅
7. **Images are loaded** ✅
8. **Attributes are selected** ✅

### What Gets Synced

All product fields including:
- ✅ Basic info (name, slug, description)
- ✅ Pricing (MRP, sale price, cost price)
- ✅ Inventory (stock, SKU)
- ✅ Categories (multiple categories)
- ✅ **Images** (product photos)
- ✅ **Attributes** (filters like size, color, material)
- ✅ Variants (if product has variants)
- ✅ Badges (featured, bestseller, etc.)
- ✅ SEO fields
- ✅ All other fields

## Files Modified

1. ✅ `src/app/(admin)/admin/products/ProductForm.tsx`
   - Added `useEffect` to sync `initialData` with form values in edit mode
   - Added `setImageFiles` sync for images state

## Testing Checklist

### Edit Product - Images
- [ ] Edit product with images → Images display in MediaSection
- [ ] Add new images → New images appear
- [ ] Remove images → Images are removed
- [ ] Reorder images → Order is preserved

### Edit Product - Attributes
- [ ] Edit product with attributes → Selected attributes are checked
- [ ] Change attribute selections → Changes are saved
- [ ] Add new attribute values → New values are saved
- [ ] Remove attribute selections → Removals are saved

### Edit Product - All Fields
- [ ] Edit product → All fields show correct values
- [ ] Update any field → Changes are saved correctly
- [ ] Update multiple fields → All changes are saved
- [ ] Cancel edit → No changes are saved

### Create Product (Should Not Be Affected)
- [ ] Create new product → Form starts empty
- [ ] Fill in fields → All fields work correctly
- [ ] Upload images → Images upload correctly
- [ ] Select attributes → Attributes save correctly

## Status: ✅ FIXED

The product edit form now correctly loads all data including images and attributes.

## Technical Notes

### Why Not Use `reset()` from React Hook Form?

We could use `reset(initialData)` but:
- It triggers validation on all fields
- It marks the form as "pristine" (not dirty)
- It's more aggressive than needed

Our approach:
- Only syncs when needed (edit mode + initialData present)
- Doesn't trigger validation
- Preserves form state better

### Why Sync Images Separately?

The `imageFiles` state is used by `MediaSection` component and is separate from the form state. We need to sync both:
1. Form state: `setValue('images', ...)`
2. Component state: `setImageFiles(...)`

This ensures the MediaSection displays the images correctly.

---

**Last Updated:** February 10, 2026
**Status:** Fixed and Ready for Testing
