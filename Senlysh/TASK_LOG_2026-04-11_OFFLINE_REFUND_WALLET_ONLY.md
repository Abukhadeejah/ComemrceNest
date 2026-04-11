# Task Log - 2026-04-11 - Offline Refund Wallet-Only Rule

## Request
Implement refund logic change for OFFLINE customers/orders only:
- On approved return/cancellation, credit full refundable amount to wallet immediately.
- No split by original payment method.
- No exclusion of previously used wallet amount.
- Prevent duplicate credits across retries / status resaves.
- Keep online behavior unchanged.

---

## Repo Paths Audited
Searched and inspected:
- `src/server/admin/offlineOrderReturns.ts`
- `src/app/api/admin/orders/[id]/returns/route.ts`
- `src/app/api/admin/orders/update-status/route.ts`
- `src/app/api/admin/orders/[id]/status/route.ts`
- `src/app/(admin)/admin/orders/OrderTable.tsx`
- `src/components/admin/orders/OfflineReturnPanel.tsx`
- `src/server/admin/offlineOrders.ts`
- `src/lib/cashback/cashbackService.ts`
- `src/app/api/admin/orders/lookup/route.ts`

---

## What Was Wrong Before
1. Offline returns used split logic:
- Wallet refund capped by original `wallet_used_cents`.
- Remaining refund assigned to `cash_refund_cents`.
- This violated new business rule requiring full wallet credit.

2. Offline cancellations had no dedicated wallet refund side effect:
- Admin status update to `cancelled` changed status only.
- No guaranteed wallet credit for offline cancellation.

3. Duplicate event risk on cancel status retries:
- Repeated or overlapping status update calls could retrigger side effects if not guarded.

---

## Final Behavior Implemented

### A) Offline Return Approval
File: `src/server/admin/offlineOrderReturns.ts`

New rule:
- `wallet_refund_cents = total_return_cents`
- `cash_refund_cents = 0`

Meaning:
- Partial return of 1000 => wallet credit 1000 immediately.
- Full return of 2000 => wallet credit 2000 immediately.
- Mixed payment source (wallet + cash) is ignored for split; full refundable return goes to wallet.

Guardrails kept/enhanced:
- Return still restricted to `order_source = offline_admin`.
- Remaining item quantity validation remains enforced.
- Return edit window check remains enforced (5 days).
- Return effect idempotency remains via `order_return_effects` claim/apply flow.
- Over-refund prevention now checks total order refundable remaining using processed return totals.

### B) Offline Cancellation Approval
New service file: `src/server/admin/offlineOrderCancellation.ts`

New logic:
- Trigger only for offline orders (`order_source = offline_admin`).
- On cancellation approval, compute remaining refundable amount:
  - `remaining = order.total_cents - processed_return_totals - prior_offline_cancellation_wallet_credits`
- If `remaining > 0`:
  - Insert wallet ledger credit with:
    - `source_key = OFFLINE_ORDER_CANCELLATION_REFUND`
    - `reference_id = order_id`
    - metadata includes reason and refund math context.
- If `remaining <= 0`:
  - Skip (already fully refunded).

Wallet ledger history:
- Explicit transaction record is written in `wallet_ledger` with metadata/audit payload.

### C) Status Route Integration (Both Endpoints)
Files:
- `src/app/api/admin/orders/update-status/route.ts`
- `src/app/api/admin/orders/[id]/status/route.ts`

Both status APIs now:
- Detect status transition to `cancelled`.
- Execute offline cancellation wallet refund handler for offline orders.
- Return no-op success when already cancelled.
- Use conditional update for cancellation (`neq('status', 'cancelled')`) to reduce duplicate-trigger risk.

This keeps behavior consistent regardless of which admin endpoint is used.

---

## Shared Rule Helpers Added
File: `src/server/admin/orderSafetyRules.ts`

Added helpers:
- `computeOfflineWalletRefundSplit(...)`
- `computeRemainingOrderRefundableCents(...)`

These are used in returns/cancellation paths for consistent math and easier testing.

---

## UI/Label Clarity Updates
- `src/components/admin/orders/OfflineReturnPanel.tsx`
  - Added explicit note that offline approved return refunds are credited to wallet immediately (no cash split).

- `src/app/(admin)/admin/orders/OrderTable.tsx`
  - Cancellation confirmation now includes note that offline cancellation refunds go to wallet immediately.

---

## Tests Added / Updated
1. `src/server/admin/orderSafetyRules.test.ts`
- Added scenario tests for:
  - offline partial return on mixed payment
  - offline full return on mixed payment
  - offline full return with zero prior wallet use
  - remaining refundable computation for cancellation after partial return
  - duplicate cancellation trigger resulting in zero remaining refundable amount

2. `src/server/admin/offlineOrderCancellation.test.ts`
- Added service-level tests for:
  - offline cancellation credits correct remaining amount to wallet ledger
  - duplicate cancellation trigger skip (already fully credited)
  - online order skip (offline rule isolation)

Test command run:
- `npm run test -- src/server/admin/orderSafetyRules.test.ts src/server/admin/offlineOrderCancellation.test.ts`
- Result: 2 files passed, 19 tests passed.

---

## Idempotency / Duplicate Protection Summary
1. Returns:
- `order_return_effects` claim/apply pattern already in place prevents duplicate wallet credits for same return effect.

2. Cancellation:
- Status routes guard no-op when already cancelled.
- Status routes use conditional cancellation update to reduce duplicate status-trigger overlap.
- Cancellation refund amount is computed as remaining refundable only.
- Existing cancellation wallet credits (`OFFLINE_ORDER_CANCELLATION_REFUND`) are included in remaining calculation.
- Retries produce zero credit once full refundable amount has already been credited.

---

## Online Flow Safety
- No online refund logic was modified.
- New cancellation wallet-credit handler explicitly skips non-offline orders.

---

## Pending / Notes
- Current duplicate protection for cancellation uses remaining refundable math + status guards and does not rely on a DB unique constraint for cancellation refund events.
- If strict single-event atomic guarantee is required under extreme concurrent writes, a DB-level uniqueness or dedicated effect-tracking row for cancellation events can be added in a migration.
