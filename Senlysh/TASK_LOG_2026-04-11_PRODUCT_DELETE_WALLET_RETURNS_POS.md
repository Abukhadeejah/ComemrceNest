# Task Log - 2026-04-11 - Product Delete, Wallet Cap, Partial Returns, Offline POS Hardening

## Request Summary
User requested 4 improvements:
1. Cannot delete multiple products from product page.
2. Wallet usage in order creation must never exceed wallet balance.
3. Partially returned orders should allow additional returns for 5 days from order creation.
4. Offline order creation should be more foolproof and POS-like.

## Scope Implemented
- Fixed bulk product delete end-to-end (UI + server action behavior).
- Enforced wallet usage cap in offline order creation UI and extra submit-time validation.
- Enabled follow-up returns for partially returned orders with strict 5-day server-side window.
- Hardened return quantity logic so additional returns cannot exceed remaining quantity.
- Improved offline order creation reliability for stock and wallet constraints.

---

## 1) Bulk Product Delete Fix

### Before
- Product table showed "Delete Selected" button.
- Button had no action in tenant admin table and global admin table.
- Existing server bulk delete used direct table delete and could fail with related records (order items/images/category links) due foreign key constraints.

### After
- Wired "Delete Selected" button to actual handler in both product tables.
- Added confirmation prompt and loading state while deleting.
- Cleared selection and refreshed list after success.
- Updated server bulk delete action to use existing safe RPC (`delete_product_safely`) per product instead of raw delete.
- This matches single-product delete behavior and handles linked records safely.

### Files
- `src/app/(tenant-admin)/[tenant]/admin/products/ProductTable.tsx`
- `src/app/(admin)/admin/products/ProductTable.tsx`
- `src/app/(admin)/admin/products/actions.ts`

---

## 2) Wallet Use Must Not Exceed Balance (Offline Order Creation)

### Before
- Wallet input accepted higher values than available balance.
- UI display and payload could carry an excessive typed value before backend rejection.

### After
- Wallet usage calculation now clamps to:
  - order total
  - wallet balance
- Added reactive input clamp to auto-correct overshoot values.
- Added input `max` based on current allowed wallet value.
- Added clear "Max usable now" helper text.
- Added submit-time guard to reject if typed wallet value exceeds allowed amount.

### Files
- `src/components/admin/orders/OfflineOrderCreateForm.tsx`

---

## 3) Additional Returns for Partially Returned Orders (5-Day Window)

### Before
- Return UI only allowed status `paid` or `fulfilled`.
- Backend blocked any additional processed return for an order (single-return model).
- No strict 5-day edit window check from order creation timestamp.

### After
- UI eligibility updated to allow `partially_returned` too.
- Added 5-day return-edit window check in UI messaging and server enforcement.
- Backend now allows additional returns for same order (within window), instead of hard-blocking after first processed return.
- Added strict per-item remaining quantity validation considering previously processed returns.
- Prevents over-return across multiple return attempts.

### Files
- `src/components/admin/orders/OfflineReturnPanel.tsx`
- `src/server/admin/offlineOrderReturns.ts`

---

## 4) Offline POS Hardening (Foolproof Behavior)

### Before
- Product quantity updates could overrun stock in UI (until backend rejection).
- Adding inventory-tracked item with zero stock had no early UX guard.
- Return UI showed sold quantity but not remaining returnable quantity, causing avoidable failures.

### After
- Prevent add for inventory-tracked products/variants when stock is zero.
- Prevent increment beyond available stock for inventory-tracked line items.
- Clamp quantity edits to stock ceiling for inventory-tracked line items.
- Return lookup now computes and returns:
  - `already_returned_quantity`
  - `remaining_returnable_quantity`
- Return panel uses remaining quantity as max and shows it explicitly in table.

### Files
- `src/components/admin/orders/OfflineOrderCreateForm.tsx`
- `src/app/api/admin/orders/lookup/route.ts`
- `src/components/admin/orders/OfflineReturnCreateForm.tsx`
- `src/components/admin/orders/OfflineReturnPanel.tsx`

---

## Data/Logic Notes for Future AI
- Returns are still tenant-scoped and restricted to `offline_admin` orders.
- Return edit window is now server-authoritative: 5 days from `orders.created_at`.
- Existing return idempotency (`clientRequestId`) was preserved.
- Multi-return protection now relies on:
  - prior processed return quantities by `order_item_id`
  - remaining quantity checks before creating new return lines
- Bulk delete now follows same safe deletion path as single delete.

## Risk/Follow-up Areas
- If business policy changes window length, update constant in `offlineOrderReturns.ts` and align UI text.
- Publish-selected products action is still a placeholder (unchanged).
- Consider adding integration tests for:
  - bulk delete with linked order items/images
  - multi-step returns over same order item
  - return attempts after 5-day window expiry
  - wallet input overshoot behavior

## Final Outcome
All 4 requested tasks were implemented with code-level enforcement and UI-level guardrails, plus this handoff log for continuity.

---

## Automated Tests Added (Follow-up)

### User Follow-up
User confirmed to proceed with automated tests for the three critical risk areas.

### What was added
- New shared rules module for deterministic business-rule testing:
  - `src/server/admin/orderSafetyRules.ts`
- New unit test file:
  - `src/server/admin/orderSafetyRules.test.ts`

### Test coverage implemented
1. Bulk delete safety rules
- Reject empty product id list.
- Reject malformed product ids.
- Accept valid UUID-like ids.

2. Wallet overuse rules
- Verify cap calculation uses `min(orderTotal, walletBalance)`.
- Allow requests within cap.
- Reject requests above cap.

3. Partial return edit/quantity rules
- Verify 5-day edit window behavior (inside and outside window).
- Verify remaining returnable quantity calculation.
- Reject requested return qty above remaining qty.
- Allow requested return qty within remaining qty.

### Integration wiring done
- Bulk delete action now uses shared bulk-id validator.
- Offline order creation server uses shared wallet cap assertion.
- Offline return creation server uses shared return window and remaining-qty assertions.

### Test run result
Command run:
- `npm run test -- src/server/admin/orderSafetyRules.test.ts`

Result:
- 1 test file passed
- 11 tests passed
- 0 failed
