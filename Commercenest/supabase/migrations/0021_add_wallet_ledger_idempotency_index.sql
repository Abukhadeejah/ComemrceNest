-- Add unique index for wallet_ledger idempotency
-- Prevents duplicate credits for the same order/cashback source
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS wallet_ledger_idempotency_idx 
ON wallet_ledger (tenant_id, account_id, source_key, reference_id)
WHERE reference_id IS NOT NULL;


