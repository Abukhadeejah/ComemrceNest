# Checkout Quantity + Cancel Route Fix Log

**Date:** 2026-03-03  
**Scope:** Checkout cart quantity inflation + production cancel-page 404 + PhonePe checkout stability

## Issues Reported

1. Selecting one product sometimes showed increased quantity after redirect to checkout.
2. Payment cancellation page worked locally but returned "Page not found" in production.
3. Checkout API previously failed with customer foreign key constraint during PhonePe flow.

## Root Causes

### 1) Quantity Inflation
- Cart sync logic merged server cart and local cart by summing quantities for matching lines.
- For authenticated users with the same item present in both places, quantity doubled unexpectedly.

### 2) Production Cancel Page 404
- Middleware host-based tenant rewrite converted `/checkout/*` routes to tenant-prefixed paths in production.
- Reverse rewrite only handled exact `/tenant/checkout`, not nested routes like `/tenant/checkout/cancel`.
- Result: success/cancel sub-routes resolved incorrectly and produced 404 in production.

### 3) Checkout FK Failure (Earlier Blocking Error)
- `orders.customer_id` was sometimes set from an invalid/non-tenant customer id.
- Insert failed due to `orders_customer_id_fkey` constraint.

## Code Changes Applied

### A) Customer ID resolution hardening
- File: `src/app/api/checkout/route.ts`
- Added tenant-safe customer id resolver:
  - validates provided customer id against `customers` table + tenant id
  - falls back to email lookup if needed
  - uses `null` when no valid customer exists
- Applied to both PhonePe and Razorpay handlers.

### B) PhonePe config/runtime hardening
- Files:
  - `src/config/phonepe.ts`
  - `src/lib/payments/phonepe.ts`
  - `src/app/api/checkout/route.ts`
- Prevented import-time crashes from strict env access.
- Added lazy SDK client retrieval and stronger runtime credential checks.
- Ensured required vars include:
  - `PHONEPE_CLIENT_ID`
  - `PHONEPE_CLIENT_SECRET`
  - `PHONEPE_MERCHANT_ID`

### C) Cart merge logic fix (quantity inflation)
- File: `src/lib/cart.tsx`
- Updated merge behavior for same cart line:
  - no longer blindly sums local + server quantities
  - now keeps one normalized line and uses safer quantity merge behavior to avoid accidental doubling.

### D) Production checkout sub-route rewrite fix
- File: `src/middleware.ts`
- Treated `/checkout/*` and `/cart/*` as global routes.
- Added rewrite handling for tenant-prefixed checkout/cart subpaths:
  - `/tenant/checkout/*` -> `/checkout/*`
  - `/tenant/cart/*` -> `/cart/*`

### E) Added explicit cancel/failure pages
- Files:
  - `src/app/(site)/checkout/cancel/page.tsx`
  - `src/app/(site)/checkout/failed/page.tsx`
  - `src/app/(site)/checkout/failure/page.tsx`
- Ensures cancellation redirect variants resolve to a user-friendly page in production.

## Validation Performed

- Type diagnostics on modified files: **No errors**.
- Targeted ESLint run:
  - no errors in new checkout cancel/failure pages or cart fix
  - two pre-existing lint issues in `src/middleware.ts` (`no-non-null-asserted-optional-chain`) unrelated to this patch.

## Expected Outcomes

1. Checkout no longer increases quantity unexpectedly during cart sync.
2. Production payment cancellation no longer leads to 404 for checkout sub-routes.
3. Checkout API is more resilient to invalid customer id inputs and missing PhonePe env setup.

## Notes

- If quantity still appears to increase from rapid multi-click on Buy Now, add UI-level single-fire protection (disable button while redirecting).
- For production, verify payment gateway callback/redirect URLs include the same host base configured in env.
