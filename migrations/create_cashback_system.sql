-- ============================================================================
-- CASHBACK SYSTEM WITH WALLET-BASED PAYMENTS
-- ============================================================================
-- This migration creates the complete cashback system where:
-- 1. Cashback only applies to cash paid (not wallet amount used)
-- 2. Dynamic cashback slabs based on profit percentage
-- 3. Requires active membership
-- ============================================================================

-- ============================================================================
-- 1. CREATE MEMBERSHIP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT memberships_type_check CHECK (membership_type IN ('FREE', 'SILVER', 'GOLD', 'PLATINUM'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_customer ON memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active ON memberships(customer_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 2. ADD CASHBACK FIELDS TO ORDERS TABLE
-- ============================================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_purchase_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_profit_pct DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS wallet_used_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_paid_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_pct DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cashback_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL;

-- Update constraint: cash_paid + wallet_used = total
ALTER TABLE orders
ADD CONSTRAINT orders_payment_split_check 
CHECK (cash_paid_cents + wallet_used_cents = total_cents);

-- ============================================================================
-- 3. CREATE CASHBACK TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
-- 4. CREATE CASHBACK SLABS TABLE (REFERENCE DATA)
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
-- 5. CREATE FUNCTION TO GET CASHBACK PERCENTAGE
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
-- 6. ADD COST_PRICE TO PRODUCTS (if not exists)
-- ============================================================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price_cents INTEGER;

-- ============================================================================
-- 7. CREATE TRIGGER TO AUTO-UPDATE MEMBERSHIP STATUS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_membership_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate expired memberships
  NEW.is_active := (NEW.valid_until > NOW());
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_membership_status ON memberships;
CREATE TRIGGER trigger_update_membership_status
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_status();

-- ============================================================================
-- 8. CREATE FUNCTION TO AUTOMATICALLY CREATE MEMBERSHIP ON CUSTOMER SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_membership()
RETURNS TRIGGER AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- Create wallet account for new customer
  INSERT INTO wallet_accounts (customer_id, tenant_id)
  VALUES (NEW.id, NEW.tenant_id)
  RETURNING id INTO wallet_id;
  
  -- Initialize wallet balance with zero
  INSERT INTO wallet_ledger (
    account_id,
    tenant_id,
    entry_type,
    amount_cents,
    currency,
    source_key,
    metadata
  ) VALUES (
    wallet_id,
    NEW.tenant_id,
    'CREDIT',
    0,
    'INR',
    'INITIAL_BALANCE',
    '{"description": "Initial wallet creation"}'::jsonb
  );
  
  -- Create FREE membership valid for 1 year
  INSERT INTO memberships (
    tenant_id,
    customer_id,
    membership_type,
    valid_from,
    valid_until,
    is_active
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    'FREE',
    NOW(),
    NOW() + INTERVAL '1 year',
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_membership ON customers;
CREATE TRIGGER trigger_create_default_membership
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION create_default_membership();

-- ============================================================================
-- 9. CREATE VIEW FOR WALLET BALANCES
-- ============================================================================
CREATE OR REPLACE VIEW v_wallet_balances AS
SELECT 
  wa.id AS wallet_account_id,
  wa.customer_id,
  wa.tenant_id,
  COALESCE(SUM(
    CASE 
      WHEN wl.entry_type = 'CREDIT' THEN wl.amount_cents
      WHEN wl.entry_type = 'DEBIT' THEN -wl.amount_cents
      ELSE 0
    END
  ), 0) AS balance_cents,
  wa.created_at
FROM wallet_accounts wa
LEFT JOIN wallet_ledger wl ON wl.account_id = wa.id
GROUP BY wa.id, wa.customer_id, wa.tenant_id, wa.created_at;

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_slabs ENABLE ROW LEVEL SECURITY;

-- Policies for memberships (customers can view their own, admins can manage)
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

-- Policies for cashback_transactions (customers can view their own)
CREATE POLICY cashback_transactions_tenant_isolation ON cashback_transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', TRUE)::UUID);

-- Cashback slabs are globally readable (reference data)
CREATE POLICY cashback_slabs_read_all ON cashback_slabs
  FOR SELECT USING (true);

-- ============================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE memberships IS 'Customer membership records for cashback eligibility';
COMMENT ON TABLE cashback_transactions IS 'Records of all cashback earned per order';
COMMENT ON TABLE cashback_slabs IS 'Reference table defining profit-to-cashback percentage mapping';
COMMENT ON COLUMN orders.wallet_used_cents IS 'Amount paid from customer wallet (zero cashback)';
COMMENT ON COLUMN orders.cash_paid_cents IS 'Amount paid in cash (eligible for cashback)';
COMMENT ON COLUMN orders.cashback_amount_cents IS 'Cashback credited to wallet after order';
COMMENT ON FUNCTION get_cashback_percentage IS 'Returns cashback % for given profit %';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (for reference, do not execute)
-- ============================================================================
/*
DROP TRIGGER IF EXISTS trigger_create_default_membership ON customers;
DROP TRIGGER IF EXISTS trigger_update_membership_status ON memberships;
DROP FUNCTION IF EXISTS create_default_membership();
DROP FUNCTION IF EXISTS update_membership_status();
DROP FUNCTION IF EXISTS get_cashback_percentage(DECIMAL);
DROP VIEW IF EXISTS v_wallet_balances;
DROP TABLE IF EXISTS cashback_transactions CASCADE;
DROP TABLE IF EXISTS cashback_slabs CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS total_purchase_price_cents;
ALTER TABLE orders DROP COLUMN IF EXISTS total_profit_pct;
ALTER TABLE orders DROP COLUMN IF EXISTS wallet_used_cents;
ALTER TABLE orders DROP COLUMN IF EXISTS cash_paid_cents;
ALTER TABLE orders DROP COLUMN IF EXISTS cashback_pct;
ALTER TABLE orders DROP COLUMN IF EXISTS cashback_amount_cents;
ALTER TABLE orders DROP COLUMN IF EXISTS membership_id;
ALTER TABLE products DROP COLUMN IF EXISTS cost_price_cents;
*/
