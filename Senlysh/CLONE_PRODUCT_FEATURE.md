# Clone Product Feature

## Overview
Added a "Clone Product" button to the admin products list page that allows admins to quickly duplicate existing products.

## Features

### Clone Button
- **Location:** Admin → Products list page
- **Icon:** Document duplicate icon (blue)
- **Position:** Between Edit and Delete buttons in the Actions column

### Cloning Behavior

When you click the clone button:

1. **Confirmation Dialog:** Shows "Clone [Product Name]? A copy will be created as a draft."

2. **What Gets Cloned:**
   - ✅ All product details (name, description, prices, etc.)
   - ✅ Product categories
   - ✅ Product variants (if any)
   - ✅ All product attributes

3. **What Changes:**
   - Name: Adds " (Copy)" suffix
   - Slug: Adds "-copy-[random]" suffix
   - SKU: Adds "-COPY" suffix
   - Status: Always set to "draft" (for review before publishing)
   - Created/Updated dates: Reset to current time

4. **What Doesn't Clone:**
   - Product ID (new ID generated)
   - Images (would need separate implementation)
   - Order history
   - Reviews/ratings

### Success Flow

After successful cloning:
- Shows success message: "Product cloned successfully! The copy has been created as a draft."
- Refreshes the products list
- New product appears at the top (most recent)
- You can then edit the cloned product to make changes

## Use Cases

1. **Create Product Variations**
   - Clone a product
   - Change size/color/variant options
   - Publish as new product

2. **Seasonal Products**
   - Clone last year's product
   - Update images and descriptions
   - Keep same pricing structure

3. **Similar Products**
   - Clone existing product
   - Modify specific details
   - Faster than creating from scratch

4. **Testing**
   - Clone production product
   - Test changes on draft copy
   - Publish when ready

## Technical Implementation

### Files Modified

1. **`src/app/(admin)/admin/products/actions.ts`**
   - Added `cloneProduct()` server action
   - Handles product duplication logic
   - Clones categories and variants
   - Generates unique slug and SKU

2. **`src/app/(admin)/admin/products/ProductTable.tsx`**
   - Added clone button with DocumentDuplicateIcon
   - Added `handleCloneProduct()` function
   - Added loading state (`cloningProductId`)
   - Shows confirmation dialog

### Code Structure

```typescript
// Server Action
export async function cloneProduct(productId: string) {
  // 1. Validate access
  // 2. Fetch original product
  // 3. Fetch related data (categories, variants)
  // 4. Create new product with modified data
  // 5. Clone categories and variants
  // 6. Invalidate cache
  // 7. Return success with new product ID
}

// Client Component
const handleCloneProduct = async (productId, productName) => {
  // 1. Show confirmation
  // 2. Call cloneProduct action
  // 3. Show success/error message
  // 4. Refresh page
}
```

## Security

- ✅ Validates tenant admin access
- ✅ Validates product ID format
- ✅ Ensures product belongs to tenant
- ✅ Creates clone in same tenant only
- ✅ Always creates as draft (prevents accidental publishing)

## Performance

- ✅ Single database transaction
- ✅ Efficient bulk inserts for categories/variants
- ✅ Cache invalidation after cloning
- ✅ Loading state prevents duplicate clicks

## Future Enhancements

Possible improvements:

1. **Clone Images**
   - Copy product images to new product
   - Requires Supabase Storage API calls

2. **Bulk Clone**
   - Select multiple products
   - Clone all at once

3. **Clone to Different Tenant**
   - For multi-tenant setups
   - Copy products between stores

4. **Clone Options**
   - Choose what to clone (variants, categories, etc.)
   - Custom name/SKU during clone

5. **Clone History**
   - Track which products were cloned from which
   - Show "Cloned from" link

## Testing

To test the feature:

1. Go to Admin → Products
2. Find any product in the list
3. Click the blue duplicate icon
4. Confirm the clone dialog
5. Wait for success message
6. Verify new product appears as draft
7. Edit the cloned product to make changes
8. Publish when ready

## Notes

- Cloned products are always created as **draft** status
- You must manually publish after reviewing
- Images are NOT cloned (would need separate implementation)
- SKU gets "-COPY" suffix to avoid conflicts
- Slug gets random suffix to ensure uniqueness

---

**Status:** ✅ Complete and working
**Date:** February 9, 2026
