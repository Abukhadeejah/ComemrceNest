-- ============================================================================
-- ORDER SOURCE TRACKING FOR ONLINE + ADMIN OFFLINE ORDERS
-- ============================================================================
-- Purpose:
-- 1) Keep online and admin-created orders in the same orders table
-- 2) Add explicit source metadata for visibility and analytics
-- 3) Preserve backward compatibility for existing rows
-- ============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_source VARCHAR(32) NOT NULL DEFAULT 'online';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_order_source_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_order_source_check
    CHECK (order_source IN ('online', 'offline_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_order_source
  ON orders (tenant_id, order_source);

COMMENT ON COLUMN orders.order_source IS
  'Order origin marker: online (site checkout) or offline_admin (admin-created order).';
