-- ============================================================================
-- CASHBACK SYSTEM WITH WALLET-BASED PAYMENTS (FIXED VERSION)
-- ============================================================================
-- This version fixes existing orders before adding constraints
-- ============================================================================

-- ============================================================================
-- 1. ADD CASHBACK FIELDS TO ORDERS TABLE (without constraints first)
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_purchase_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_profit_pct DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS wallet_used_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_paid_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_pct DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cashback_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS membership_id UUID;

-- ============================================================================
-- 2. FIX EXISTING ORDERS (set cash_paid_cents = total_cents for old orders)
-- ============================================================================
UPDATE orders
SET cash_paid_cents = total_cents,
    wallet_used_cents = 0
WHERE cash_paid_cents = 0 AND wallet_used_cents = 0;

-- ============================================================================
-- 3. NOW ADD THE CONSTRAINT (after fixing data)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_split_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_split_check 
    CHECK (cash_paid_cents + wallet_used_cents = total_cents);
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE CASHBACK TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  wallet_used_cents INTEGER NOT NULL,
  cash_paid_cents INTEGER NOT NULL,
  profit_pct DECIMAL(10,2) NOT NULL,
  cashback_pct DECIMAL(10,2) NOT NULL,
  cashback_amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cashback_transactions_unique_order UNIQUE(order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_order ON cashback_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_customer ON cashback_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_tenant ON cashback_transactions(tenant_id);

-- ============================================================================
-- 5. CREATE CASHBACK SLABS TABLE (REFERENCE DATA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cashback_slabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_profit_pct DECIMAL(10,2) NOT NULL,
  max_profit_pct DECIMAL(10,2) NOT NULL,
  cashback_pct DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cashback_slabs_range_check CHECK (min_profit_pct <= max_profit_pct),
  CONSTRAINT cashback_slabs_unique_range UNIQUE(min_profit_pct, max_profit_pct)
);

-- Insert cashback slabs according to business rules
INSERT INTO cashback_slabs (min_profit_pct, max_profit_pct, cashback_pct) VALUES
(31.0, 40.0, 10.0),
(41.0, 50.0, 15.0),
(51.0, 60.0, 20.0),
(61.0, 70.0, 25.0),
(71.0, 80.0, 30.0),
(81.0, 90.0, 35.0),
(91.0, 100.0, 40.0),
(101.0, 150.0, 50.0),
(151.0, 200.0, 50.0),
(201.0, 250.0, 50.0),
(251.0, 300.0, 55.0),
(351.0, 400.0, 55.0),
(451.0, 500.0, 55.0)
ON CONFLICT (min_profit_pct, max_profit_pct) DO NOTHING;

-- ============================================================================
-- 6. CREATE FUNCTION TO GET CASHBACK PERCENTAGE
-- ============================================================================
CREATE OR REPLACE FUNCTION get_cashback_percentage(profit_percentage DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  cashback_rate DECIMAL;
BEGIN
  SELECT cashback_pct INTO cashback_rate
  FROM cashback_slabs
  WHERE profit_percentage >= min_profit_pct 
    AND profit_percentage <= max_profit_pct
  LIMIT 1;
  
  RETURN COALESCE(cashback_rate, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_slabs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS cashback_transactions_tenant_isolation ON cashback_transactions;
DROP POLICY IF EXISTS cashback_slabs_read_all ON cashback_slabs;

-- Policies for cashback_transactions (customers can view their own)
CREATE POLICY cashback_transactions_tenant_isolation ON cashback_transactions
  FOR ALL USING (true); -- Simplified for now, adjust based on your RLS setup

-- Cashback slabs are globally readable (reference data)
CREATE POLICY cashback_slabs_read_all ON cashback_slabs
  FOR SELECT USING (true);

-- ============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE cashback_transactions IS 'Records of all cashback earned per order';
COMMENT ON TABLE cashback_slabs IS 'Reference table defining profit-to-cashback percentage mapping';
COMMENT ON COLUMN orders.wallet_used_cents IS 'Amount paid from customer wallet (zero cashback)';
COMMENT ON COLUMN orders.cash_paid_cents IS 'Amount paid in cash (eligible for cashback)';
COMMENT ON COLUMN orders.cashback_amount_cents IS 'Cashback credited to wallet after order';
COMMENT ON FUNCTION get_cashback_percentage IS 'Returns cashback % for given profit %';

-- ============================================================================
-- DONE!
-- ============================================================================
