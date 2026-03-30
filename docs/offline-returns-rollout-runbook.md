# Offline Returns Rollout Runbook

## Scope
This runbook covers operational rollout for offline/admin order returns implemented in CommerceNest.

Implemented feature areas:
- Schema: order_returns, order_return_items, order_return_effects, client_request_id idempotency
- Backend: POST /api/admin/orders/[id]/returns
- UI: return panel + return history on admin order-details pages
- Validation: scripts/test-offline-returns.js (3/3 pass)

## Migration Order
Apply migrations in this exact order:

1. migrations/create_offline_order_returns_system.sql
2. migrations/add_order_returns_client_request_id.sql

Reason:
- Step 2 alters order_returns and depends on table creation from step 1.

## Pre-Deployment Checks
1. Confirm backup/snapshot for production database.
2. Confirm service role key and app env vars are available.
3. Confirm app build passes in staging.
4. Confirm admin users understand return behavior and restrictions:
   - offline_admin orders only
   - paid/fulfilled only

## Deployment Steps
1. Deploy backend + UI code to staging.
2. Apply both return migrations on staging DB.
3. Run validation harness on staging:
   - node scripts/test-offline-returns.js
4. Verify expected harness output:
   - Duplicate submit replay passes
   - Partial return + over-quantity guard passes
   - Refund split consistency checks pass
5. Perform manual admin smoke test in UI:
   - open order-details for an offline paid order
   - create a partial return
   - verify return appears in Return History
6. Promote code to production.
7. Apply the same migrations on production DB.
8. Re-run smoke test on production.

## Admin Usage Notes
1. Navigate to Orders list and open an eligible order using Create Return or View Details.
2. On order-details page:
   - set return quantities per item
   - optionally toggle restock behavior
   - optionally add reason/notes
3. Submit Create Return.
4. Review Return History section for:
   - return number and status
   - refund split (wallet/cash)
   - cashback reversal amount
   - line-level quantities/restock totals

## Business Rules Enforced
1. Returns allowed only for order_source = offline_admin.
2. Returns allowed only when status is paid or fulfilled.
3. Returned quantity cannot exceed sold quantity cumulatively.
4. Restock quantity cannot exceed returned quantity.
5. Refund split must equal total return amount.
6. Wallet and cash refunds cannot exceed remaining refundable amounts across prior returns.
7. Duplicate submit retries with same clientRequestId replay safely.

## Production Safety Checklist
1. Database
- [ ] Both return migrations applied successfully.
- [ ] order_returns table visible in DB schema cache.
- [ ] uq_order_returns_client_request index exists.

2. API
- [ ] POST /api/admin/orders/[id]/returns returns 200 for valid requests.
- [ ] Invalid split returns 400 with clear message.
- [ ] Over-quantity returns 400 with clear message.
- [ ] Duplicate request with same clientRequestId replays existing return.

3. Wallet/Cashback/Inventory
- [ ] Wallet refund ledger entries use RETURN_REFUND source key.
- [ ] Cashback reversal ledger entries use CASHBACK_REVERSAL source key when applicable.
- [ ] stock_restock effects do not double-apply on retries.
- [ ] order_return_effects rows are created exactly once per effect scope.

4. UI
- [ ] Create Return panel visible only for eligible offline paid/fulfilled orders.
- [ ] Return History renders latest returns and line details.
- [ ] Orders list Create Return link appears only on eligible rows.

5. Observability
- [ ] Capture API errors from returns route in deployment logs.
- [ ] Monitor wallet ledger anomalies for RETURN_REFUND/CASHBACK_REVERSAL.
- [ ] Monitor repeated 400s for split and quantity validation to catch misuse.

## Rollback Guidance
If critical issues occur after deployment:
1. Disable UI entry by temporarily hiding Create Return action/panel in admin pages.
2. Keep DB migrations in place (avoid destructive rollback of historical financial data).
3. Patch backend route to return maintenance error while preserving read history.
4. Investigate using order_return_effects and wallet_ledger audit trails.

## Post-Deployment Verification Query Checklist (Conceptual)
1. Recent returns created today by tenant.
2. Return lines for a specific return id.
3. Side-effect audit rows by order_return_id.
4. Wallet ledger rows filtered by reference_id = order_return_id.

Use existing admin/supabase tooling to execute these queries in your environment.
