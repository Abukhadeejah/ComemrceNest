-- ============================================================================
-- ORDER ITEM VARIANT SUPPORT
-- ============================================================================
-- Purpose:
-- 1) Persist variant selection on order_items and order_return_items
-- 2) Add atomic stock restock helper for product variants
-- 3) Keep offline/admin return mechanics inventory-safe for variant products
-- ============================================================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES product_variants(id) ON DELETE RESTRICT;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_name TEXT NULL;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_attributes JSONB NULL DEFAULT '{}'::jsonb;

ALTER TABLE order_return_items
ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES product_variants(id) ON DELETE RESTRICT;

ALTER TABLE order_return_items
ADD COLUMN IF NOT EXISTS variant_name TEXT NULL;

CREATE OR REPLACE FUNCTION increment_product_variant_stock_atomic(
  p_tenant_id UUID,
  p_variant_id UUID,
  p_increment_by INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_increment_by IS NULL OR p_increment_by <= 0 THEN
    RAISE EXCEPTION 'Variant stock increment must be a positive integer';
  END IF;

  UPDATE product_variants
  SET stock = COALESCE(stock, 0) + p_increment_by
  WHERE tenant_id = p_tenant_id
    AND id = p_variant_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Product variant not found for scoped atomic restock';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
