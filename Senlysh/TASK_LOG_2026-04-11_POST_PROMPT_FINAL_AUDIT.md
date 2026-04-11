# Task Log - 2026-04-11 - Post-Prompt Final Audit and Fixes

Scope: This log includes only changes made after your final surgical-audit prompt.

## 1) Route Wiring Consistency Fix

### File
- src/app/api/admin/orders/update-status/route.ts

### Change
- Added explicit current order lookup error handling before cancellation logic.
- Route now returns 404 immediately if current order cannot be loaded in tenant scope.

### Why
- Prevents false-positive "already cancelled" behavior for missing/inaccessible orders.
- Aligns behavior with the [id]/status endpoint.

---

## 2) Return Window Guard Hardening

### File
- src/server/admin/orderSafetyRules.ts

### Change
- Updated isWithinReturnEditWindow to reject future created_at timestamps.

### Why
- Future timestamps are invalid and should not pass return-window checks.

---

## 3) Return CTA Policy Alignment (UI)

### File
- src/app/(admin)/admin/orders/OrderTable.tsx

### Change
- Removed stale has_processed_return gate from Create Return CTA.
- Allowed CTA for offline orders in paid, fulfilled, and partially_returned statuses.

### Why
- UI now matches backend multi-return policy within 5-day window.

---

## 4) Migration Preflight for Existing Duplicate Data

### File
- migrations/add_offline_cancellation_wallet_refund_uniqueness.sql

### Change
- Added DO-block preflight check for duplicate wallet_ledger rows for OFFLINE_ORDER_CANCELLATION_REFUND credits.
- Migration now fails fast with clear message and remediation hint if duplicates exist.

### Why
- Avoids opaque index-creation failure during deployment.
- Makes production-readiness behavior explicit and auditable.

---

## 5) Route-Level Tests Added

### Files
- src/app/api/admin/orders/update-status/route.test.ts
- src/app/api/admin/orders/[id]/status/route.test.ts

### Coverage Added
- Returns 404 when order cannot be loaded in tenant scope.
- No-op success when already cancelled.
- Calls offline cancellation refund path only for offline cancellation transition.

### Test infra notes
- Used vi.hoisted-based mocks to satisfy Vitest module-hoisting behavior.
- Added cacheTags mocks in both tests for stable module resolution.

---

## 6) Rules Test Extension

### File
- src/server/admin/orderSafetyRules.test.ts

### Change
- Added test case asserting future created_at is non-editable.

---

## 7) Validation Executed

Command run:
- npm run test -- src/server/admin/orderSafetyRules.test.ts src/server/admin/offlineOrderCancellation.test.ts src/app/api/admin/orders/update-status/route.test.ts src/app/api/admin/orders/[id]/status/route.test.ts

Result:
- 4 test files passed
- 27 tests passed
- 0 failed

---

## 8) Net Effect of This Pass

- Both admin status endpoints now behave consistently for cancellation edge cases.
- Offline return window logic is stricter and safer.
- Orders UI no longer blocks valid follow-up offline returns.
- Cancellation uniqueness migration now includes deploy-time duplicate-data preflight.
- Route-level regression tests now exist for the critical cancellation paths.
