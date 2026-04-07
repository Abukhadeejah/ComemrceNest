-- ============================================================================
-- ADD CLIENT REQUEST IDEMPOTENCY TO ORDER RETURNS
-- ============================================================================
-- Purpose:
-- 1) Prevent duplicate return creation on retries/double-submit
-- 2) Allow safe replay when the same request id is sent again
-- ============================================================================

ALTER TABLE order_returns
ADD COLUMN IF NOT EXISTS client_request_id TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_returns_client_request
  ON order_returns (tenant_id, order_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

COMMENT ON COLUMN order_returns.client_request_id IS
  'Optional client-provided idempotency key for safe return creation retries.';
