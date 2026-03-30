-- ============================================================================
-- OFFLINE ORDER RETURNS SCHEMA (PHASE 2)
-- ============================================================================
-- Purpose:
-- 1) Add item-level return storage linked to existing orders/order_items
-- 2) Enforce tenant-safe quantity limits (cannot return more than sold quantity)
-- 3) Add idempotency guards to prevent duplicate refund/restock effects
-- ============================================================================

-- 1) Return header table
CREATE TABLE IF NOT EXISTS order_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
  return_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('draft', 'processed', 'cancelled')),
  reason TEXT NULL,
  notes TEXT NULL,
  total_return_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_return_cents >= 0),
  wallet_refund_cents INTEGER NOT NULL DEFAULT 0 CHECK (wallet_refund_cents >= 0),
  cash_refund_cents INTEGER NOT NULL DEFAULT 0 CHECK (cash_refund_cents >= 0),
  cashback_reversal_cents INTEGER NOT NULL DEFAULT 0 CHECK (cashback_reversal_cents >= 0),
  processed_at TIMESTAMPTZ NULL,
  created_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_returns_tenant_return_number_key UNIQUE (tenant_id, return_number),
  CONSTRAINT order_returns_refund_split_check
    CHECK (wallet_refund_cents + cash_refund_cents = total_return_cents)
);

CREATE INDEX IF NOT EXISTS idx_order_returns_tenant_order
  ON order_returns (tenant_id, order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_returns_tenant_status
  ON order_returns (tenant_id, status, created_at DESC);

-- 2) Return line items
CREATE TABLE IF NOT EXISTS order_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_return_id UUID NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  returned_quantity INTEGER NOT NULL CHECK (returned_quantity > 0),
  restock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (restock_quantity >= 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  return_subtotal_cents INTEGER NOT NULL CHECK (return_subtotal_cents >= 0),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_return_items_return_item_unique UNIQUE (order_return_id, order_item_id),
  CONSTRAINT order_return_items_restock_le_return_qty CHECK (restock_quantity <= returned_quantity)
);

CREATE INDEX IF NOT EXISTS idx_order_return_items_tenant_return
  ON order_return_items (tenant_id, order_return_id);

CREATE INDEX IF NOT EXISTS idx_order_return_items_tenant_order_item
  ON order_return_items (tenant_id, order_item_id);

-- 3) Idempotency table for side effects (refund/restock/cashback reversal)
CREATE TABLE IF NOT EXISTS order_return_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_return_id UUID NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_return_item_id UUID NULL REFERENCES order_return_items(id) ON DELETE CASCADE,
  effect_type TEXT NOT NULL CHECK (effect_type IN ('wallet_refund', 'cash_refund', 'stock_restock', 'cashback_reversal')),
  reference_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item-level uniqueness: one effect type per return-line
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_return_effects_item
  ON order_return_effects (tenant_id, order_return_id, order_return_item_id, effect_type)
  WHERE order_return_item_id IS NOT NULL;

-- Header-level uniqueness: one effect type per return header when no line scope
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_return_effects_header
  ON order_return_effects (tenant_id, order_return_id, effect_type)
  WHERE order_return_item_id IS NULL;

-- 4) Keep updated_at fresh on return header
CREATE OR REPLACE FUNCTION set_order_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_returns_updated_at ON order_returns;
CREATE TRIGGER trg_order_returns_updated_at
  BEFORE UPDATE ON order_returns
  FOR EACH ROW
  EXECUTE FUNCTION set_order_returns_updated_at();

-- 5) Validate line integrity + cumulative quantity safety
CREATE OR REPLACE FUNCTION validate_order_return_item_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_return_order_id UUID;
  v_order_item_qty INTEGER;
  v_prev_returned_qty INTEGER;
BEGIN
  -- Ensure return header is tenant-aligned and fetch target order_id
  SELECT order_id INTO v_return_order_id
  FROM order_returns
  WHERE id = NEW.order_return_id
    AND tenant_id = NEW.tenant_id;

  IF v_return_order_id IS NULL THEN
    RAISE EXCEPTION 'Return header not found in tenant scope';
  END IF;

  -- Ensure order_item belongs to same tenant and fetch sold qty + order_id
  SELECT order_id, quantity INTO v_order_id, v_order_item_qty
  FROM order_items
  WHERE id = NEW.order_item_id
    AND tenant_id = NEW.tenant_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Order item not found in tenant scope';
  END IF;

  IF v_order_id <> v_return_order_id THEN
    RAISE EXCEPTION 'Order item does not belong to return header order';
  END IF;

  -- Ensure product alignment with order_item
  IF EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.id = NEW.order_item_id
      AND oi.tenant_id = NEW.tenant_id
      AND oi.product_id <> NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Product mismatch for return line';
  END IF;

  -- Cumulative returned qty must not exceed sold qty (excluding cancelled returns)
  SELECT COALESCE(SUM(ori.returned_quantity), 0)
    INTO v_prev_returned_qty
  FROM order_return_items ori
  JOIN order_returns r ON r.id = ori.order_return_id
  WHERE ori.tenant_id = NEW.tenant_id
    AND ori.order_item_id = NEW.order_item_id
    AND r.status <> 'cancelled'
    AND ori.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF (v_prev_returned_qty + NEW.returned_quantity) > v_order_item_qty THEN
    RAISE EXCEPTION
      'Returned quantity exceeds sold quantity (sold=%, already_returned=%, new=%)',
      v_order_item_qty, v_prev_returned_qty, NEW.returned_quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_return_item_integrity ON order_return_items;
CREATE TRIGGER trg_validate_order_return_item_integrity
  BEFORE INSERT OR UPDATE ON order_return_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_return_item_integrity();

COMMENT ON TABLE order_returns IS
  'Offline/admin return headers linked to existing orders with refund totals and status.';

COMMENT ON TABLE order_return_items IS
  'Item-level return rows linked to order_items; enforces return qty safety per item.';

COMMENT ON TABLE order_return_effects IS
  'Idempotency/audit rows for return side effects (refund/restock/cashback reversal).';
