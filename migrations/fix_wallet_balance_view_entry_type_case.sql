-- ============================================================================
-- FIX WALLET BALANCE VIEW ENTRY TYPE CASE HANDLING
-- ============================================================================
-- Purpose:
-- 1) Ensure wallet balance view works for both lowercase and uppercase entry types
-- 2) Prevent incorrect zero balances when ledger stores 'credit'/'debit'
-- ============================================================================

CREATE OR REPLACE VIEW v_wallet_balances AS
SELECT
  wa.id AS wallet_account_id,
  wa.customer_id,
  wa.tenant_id,
  COALESCE(SUM(
    CASE
      WHEN LOWER(wl.entry_type) = 'credit' THEN wl.amount_cents
      WHEN LOWER(wl.entry_type) = 'debit' THEN -wl.amount_cents
      ELSE 0
    END
  ), 0) AS balance_cents,
  wa.created_at
FROM wallet_accounts wa
LEFT JOIN wallet_ledger wl ON wl.account_id = wa.id
GROUP BY wa.id, wa.customer_id, wa.tenant_id, wa.created_at;
