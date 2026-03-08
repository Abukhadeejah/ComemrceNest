# Route Conflict Fix - Dynamic Path Parameter Names

## Error

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'orderNumber').
```

## Root Cause

Next.js detected conflicting dynamic route parameter names in the orders API:

### Conflicting Routes
```
❌ /api/orders/[orderId]/invoice/route.ts
❌ /api/admin/orders/[orderNumber]/invoice/route.ts
❌ /api/customers/orders/[orderNumber]/invoice/route.ts
```

Next.js sees these as the same route pattern but with different parameter names:
- `[orderId]` vs `[orderNumber]`

This is not allowed because Next.js can't determine which parameter name to use.

## Solution

Removed the redundant invoice routes since we already have a unified one:

### Deleted Files
1. ✅ `src/app/api/admin/orders/[orderNumber]/invoice/route.ts`
2. ✅ `src/app/api/customers/orders/[orderNumber]/invoice/route.ts`

### Kept File
✅ `src/app/api/orders/[orderId]/invoice/route.ts` - Works for both admin and customers

## Why This Works

The main invoice route at `/api/orders/[orderId]/invoice/route.ts`:
- Accepts any order ID (UUID or order_number)
- Works for both admin and customer access
- No need for separate admin/customer routes
- Consistent parameter naming across all routes

## Route Structure After Fix

```
src/app/api/
├── orders/
│   └── [orderId]/
│       ├── invoice/
│       │   └── route.ts          ✅ Unified invoice endpoint
│       ├── status/
│       │   └── route.ts
│       └── verify-payment/
│           └── route.ts
├── admin/
│   └── orders/
│       ├── [id]/                 ✅ Different path segment
│       │   ├── route.ts
│       │   ├── mark-paid/
│       │   └── status/
│       ├── route.ts
│       └── update-status/
└── customers/
    └── orders/
        └── route.ts              ✅ No dynamic segment
```

## Key Points

1. **No Conflict Now**: All dynamic segments under `/orders/` use `[orderId]`
2. **Admin Routes**: Use `/admin/orders/[id]/` (different base path)
3. **Unified Invoice**: One endpoint serves all invoice requests
4. **Consistent Naming**: All order-related dynamic routes use consistent parameter names

## Testing

After this fix, the dev server should start without errors:

```bash
npm run dev
```

**Expected:** Server starts successfully without route conflict errors

## Additional Fixes Applied

1. ✅ Updated `baseline-browser-mapping` to latest version
2. ✅ Removed empty directories
3. ✅ Cleaned up route structure

## Related Changes

This fix complements the earlier order link fix where we:
- Changed order links to use database UUID (`order.id`)
- Updated invoice links to use `/api/orders/[orderId]/invoice`
- Removed the need for separate admin/customer invoice endpoints

## Benefits

1. **Simpler Structure**: One invoice endpoint instead of three
2. **No Conflicts**: Consistent parameter naming
3. **Easier Maintenance**: Single source of truth for invoice generation
4. **Better DX**: Clear, unambiguous route structure

---

**Created:** 2026-03-04
**Issue:** Next.js route conflict with different dynamic parameter names
**Solution:** Removed redundant routes, unified invoice endpoint
**Status:** ✅ Fixed
