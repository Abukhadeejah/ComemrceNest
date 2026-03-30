-- ============================================================================
-- HARDEN OFFLINE RETURN EFFECTS + STATUS TRANSITIONS
-- ============================================================================
-- Purpose:
-- 1) Add apply-state tracking for return effects (retry-safe side effects)
-- 2) Prevent status downgrade from processed -> cancelled without workflow
-- ============================================================================

ALTER TABLE order_return_effects
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ NULL;

ALTER TABLE order_return_effects
ADD COLUMN IF NOT EXISTS last_error TEXT NULL;

CREATE OR REPLACE FUNCTION prevent_processed_return_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'processed' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Processed returns cannot be cancelled directly. Use compensating workflow.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_processed_return_cancellation ON order_returns;
CREATE TRIGGER trg_prevent_processed_return_cancellation
  BEFORE UPDATE OF status ON order_returns
  FOR EACH ROW
  EXECUTE FUNCTION prevent_processed_return_cancellation();

CREATE OR REPLACE FUNCTION increment_product_stock_atomic(
  p_tenant_id UUID,
  p_product_id UUID,
  p_increment_by INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_increment_by IS NULL OR p_increment_by <= 0 THEN
    RAISE EXCEPTION 'Stock increment must be a positive integer';
  END IF;

  UPDATE products
  SET stock = COALESCE(stock, 0) + p_increment_by
  WHERE tenant_id = p_tenant_id
    AND id = p_product_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Product not found for scoped atomic restock';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_order_return_cumulative_financials()
RETURNS TRIGGER AS $$
DECLARE
  v_order_wallet_used INTEGER := 0;
  v_order_cash_paid INTEGER := 0;
  v_order_cashback INTEGER := 0;
  v_wallet_sum INTEGER := 0;
  v_cash_sum INTEGER := 0;
  v_cashback_sum INTEGER := 0;
BEGIN
  SELECT
    COALESCE(wallet_used_cents, 0),
    COALESCE(cash_paid_cents, 0),
    COALESCE(cashback_amount_cents, 0)
  INTO v_order_wallet_used, v_order_cash_paid, v_order_cashback
  FROM orders
  WHERE tenant_id = NEW.tenant_id
    AND id = NEW.order_id
  FOR UPDATE;

  SELECT
    COALESCE(SUM(wallet_refund_cents), 0),
    COALESCE(SUM(cash_refund_cents), 0),
    COALESCE(SUM(cashback_reversal_cents), 0)
  INTO v_wallet_sum, v_cash_sum, v_cashback_sum
  FROM order_returns
  WHERE tenant_id = NEW.tenant_id
    AND order_id = NEW.order_id
    AND status <> 'cancelled'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  v_wallet_sum := v_wallet_sum + COALESCE(NEW.wallet_refund_cents, 0);
  v_cash_sum := v_cash_sum + COALESCE(NEW.cash_refund_cents, 0);
  v_cashback_sum := v_cashback_sum + COALESCE(NEW.cashback_reversal_cents, 0);

  IF v_wallet_sum > v_order_wallet_used THEN
    RAISE EXCEPTION 'Cumulative wallet refunds exceed wallet used for order';
  END IF;

  IF v_cash_sum > v_order_cash_paid THEN
    RAISE EXCEPTION 'Cumulative cash refunds exceed cash paid for order';
  END IF;

  IF v_cashback_sum > v_order_cashback THEN
    RAISE EXCEPTION 'Cumulative cashback reversals exceed order cashback';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_return_cumulative_financials ON order_returns;
CREATE TRIGGER trg_validate_order_return_cumulative_financials
  BEFORE INSERT OR UPDATE OF wallet_refund_cents, cash_refund_cents, cashback_reversal_cents, status
  ON order_returns
  FOR EACH ROW
  WHEN (NEW.status <> 'cancelled')
  EXECUTE FUNCTION validate_order_return_cumulative_financials();
