Here is the session log including key points and the list of files you need to edit for fixing your React Hook Form + TypeScript integration issues:

***

## Session Log Summary

- You shared your existing product draft type and your ProductForm.tsx for refactoring with React Hook Form and Yup.
- You received a refactored ProductForm.tsx integrating RHF and Yup.
- You encountered TypeScript errors mainly caused by:
  - Type mismatches between your ProductFormData fields (string | number vs number)
  - Child components expecting simple string error maps instead of RHF FieldErrors
  - Passing props (like setValue) not declared in child prop types
  - Misuse of FormData API (e.g., passing array instead of strings)
  - Duplicate keys and improper defaultValues merging
- A step-by-step guide was provided to fix these issues, emphasizing:
  - Defining numeric fields as numbers,
  - Adjusting child errors props,
  - Proper generic types for handlers,
  - Passing only existing props,
  - Safe optional chaining,
  - Mapping errors for children if needed.
- You provided your BasicInformationSection.tsx for type update help.
- A corrected BasicInformationSection was shared with usage of RHF's `register`, typed `errors`, and proper error message display.
- You asked which files to edit to fix all this, and the list was given.

***

## Files to Edit

1. **`src/app/(admin)/admin/products/ProductForm.tsx`**  
   - Main form component: fix typing, defaultValues, error handling, submit logic, and prop passing.

2. **`src/types/product.ts`**  
   - Define and fix `ProductFormData`, `UIOption`, `UICombination` types.  
   - Set numeric fields to `number` type.

3. **Child components in `src/app/(admin)/admin/products/components/`**:  
   - `BasicInformationSection.tsx`  
   - `PricingSection.tsx`  
   - `InventorySection.tsx`  
   - `ShippingSection.tsx`  
   - `TaxSection.tsx`  
   - `OrganizationSection.tsx`  
   - `VariantsSection.tsx`  
   - `BadgeSection.tsx`  
   - `SeoSection.tsx`  
   - Any other form sections like `SizeGuideSection.tsx`, `MediaSection.tsx`.

For these components:  
- Update prop interfaces to accept RHF errors as `FieldErrors<ProductFormData>`.  
- Add `register`, `setValue`, `control`, and variant field arrays as props if they are wired to RHF.  
- Adjust component internals to use RHF APIs correctly.

***

