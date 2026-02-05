-- ============================================================================
-- PREMIUM MEMBERSHIP SYSTEM WITH CASHBACK OVERHAUL - COMPLETE REBUILD
-- ============================================================================
-- This migration creates a new premium membership system where:
-- 1. New signups get 1 month FREE premium membership
-- 2. Only premium members earn cashback
-- 3. Users can choose either discount coupon OR cashback (not both)
-- 4. Cashback calculated only on actual payment (excluding discounts/cashback)
-- 5. PhonePe integration for membership payments
-- 6. Membership status indicator with renewal options
-- ============================================================================

-- ============================================================================
-- 1. DROP OLD CASHBACK SYSTEM TABLES AND CLEAN UP
-- ============================================================================
DROP TABLE IF EXISTS cashback_transactions CASCADE;
DROP TABLE IF EXISTS cashback_slabs CASCADE;
DROP TABLE IF EXISTS premium_cashback_transactions CASCADE;
DROP TABLE IF EXISTS membership_payments CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS cashback_settings CASCADE;
DROP TABLE IF EXISTS membership_pricing CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS create_trial_membership_for_customer() CASCADE;
DROP FUNCTION IF EXISTS get_active_membership(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_premium_cashback(UUID, UUID, INTEGER, INTEGER, INTEGER) CASCADE;

-- Drop old views
DROP VIEW IF EXISTS v_customer_membership_status CASCADE;

-- ============================================================================
-- 3. CREATE MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_type VARCHAR(20) NOT NULL DEFAULT 'PREMIUM',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  payment_provider VARCHAR(20),
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT memberships_type_check CHECK (membership_type IN ('FREE', 'PREMIUM')),
  CONSTRAINT memberships_status_check CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING')),
  CONSTRAINT memberships_unique_active_customer UNIQUE(customer_id, tenant_id)
);

-- Indexes for performance
CREATE INDEX idx_memberships_customer ON memberships(customer_id);
CREATE INDEX idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX idx_memberships_active ON memberships(customer_id, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_memberships_expiry ON memberships(valid_until) WHERE status = 'ACTIVE';

-- ============================================================================
-- 4. CREATE MEMBERSHIP PAYMENTS TABLE
-- ============================================================================
CREATE TABLE membership_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  payment_provider VARCHAR(20) NOT NULL,
  payment_reference VARCHAR(100) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  payment_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT membership_payments_status_check CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'))
);

-- Indexes
CREATE INDEX idx_membership_payments_customer ON membership_payments(customer_id);
CREATE INDEX idx_membership_payments_membership ON membership_payments(membership_id);
CREATE INDEX idx_membership_payments_reference ON membership_payments(payment_reference);
CREATE INDEX idx_membership_payments_status ON membership_payments(payment_status);

-- ============================================================================
-- 2. UPDATE ORDERS TABLE FOR NEW CASHBACK SYSTEM
-- ============================================================================
-- Clean up old fields and add new ones
ALTER TABLE orders 
DROP COLUMN IF EXISTS total_purchase_price_cents,
DROP COLUMN IF EXISTS total_profit_pct,
DROP COLUMN IF EXISTS cashback_pct,
DROP COLUMN IF EXISTS cashback_amount_cents,
DROP COLUMN IF EXISTS membership_id,
DROP COLUMN IF EXISTS discount_amount_cents,
DROP COLUMN IF EXISTS cashback_eligible_amount_cents,
DROP COLUMN IF EXISTS cashback_earned_cents,
DROP COLUMN IF EXISTS cashback_rate_pct,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS membership_used_id,
DROP COLUMN IF EXISTS coupon_used_id;

-- Add new fields for premium cashback system
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_eligible_amount_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_earned_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_used_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS coupon_used_id UUID,
ADD COLUMN IF NOT EXISTS payment_choice VARCHAR(20) NOT NULL DEFAULT 'CASH_ONLY';

-- Add constraint for payment choice
ALTER TABLE orders
ADD CONSTRAINT orders_payment_choice_check 
CHECK (payment_choice IN ('CASH_ONLY', 'COUPON_DISCOUNT', 'CASHBACK_ELIGIBLE'));

-- Update payment split constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_split_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_split_check 
CHECK (cash_paid_cents + wallet_used_cents + discount_amount_cents = total_cents);

-- ============================================================================
-- 5. CREATE NEW CASHBACK TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE premium_cashback_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  eligible_amount_cents INTEGER NOT NULL,
  cashback_rate_pct DECIMAL(5,2) NOT NULL,
  cashback_earned_cents INTEGER NOT NULL,
  wallet_credited_cents INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT premium_cashback_status_check CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
  CONSTRAINT premium_cashback_unique_order UNIQUE(order_id)
);

-- Indexes
CREATE INDEX idx_premium_cashback_order ON premium_cashback_transactions(order_id);
CREATE INDEX idx_premium_cashback_customer ON premium_cashback_transactions(customer_id);
CREATE INDEX idx_premium_cashback_membership ON premium_cashback_transactions(membership_id);
CREATE INDEX idx_premium_cashback_status ON premium_cashback_transactions(status);

-- ============================================================================
-- 6. CREATE CASHBACK SETTINGS TABLE
-- ============================================================================
CREATE TABLE cashback_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cashback_rate_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  min_order_amount_cents INTEGER NOT NULL DEFAULT 50000, -- ₹500 minimum
  max_cashback_per_order_cents INTEGER NOT NULL DEFAULT 50000, -- ₹500 max per order
  max_cashback_per_month_cents INTEGER NOT NULL DEFAULT 500000, -- ₹5000 max per month
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cashback_settings_unique_tenant UNIQUE(tenant_id)
);

-- Insert default settings for existing tenants
INSERT INTO cashback_settings (tenant_id, cashback_rate_pct, min_order_amount_cents, max_cashback_per_order_cents, max_cashback_per_month_cents)
SELECT id, 5.00, 50000, 50000, 500000
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- 7. CREATE MEMBERSHIP PRICING TABLE
-- ============================================================================
CREATE TABLE membership_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  duration_months INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT membership_pricing_unique_tenant_duration UNIQUE(tenant_id, duration_months)
);

-- Insert default pricing for existing tenants
INSERT INTO membership_pricing (tenant_id, duration_months, price_cents)
SELECT id, 1, 4900 FROM tenants  -- ₹49 per month (was ₹99)
UNION ALL
SELECT id, 3, 12900 FROM tenants  -- ₹129 for 3 months (₹43/month)
UNION ALL
SELECT id, 6, 24900 FROM tenants  -- ₹249 for 6 months (₹41/month)
UNION ALL
SELECT id, 12, 49900 FROM tenants -- ₹499 for 12 months (₹41/month)
ON CONFLICT (tenant_id, duration_months) DO NOTHING;

-- ============================================================================
-- 8. CREATE FUNCTION TO AUTO-CREATE TRIAL MEMBERSHIP FOR NEW CUSTOMERS
-- ============================================================================
CREATE OR REPLACE FUNCTION create_trial_membership_for_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 1-year free membership for new customer (changed from 1 month)
  INSERT INTO memberships (
    tenant_id,
    customer_id,
    membership_type,
    status,
    valid_from,
    valid_until,
    is_trial,
    auto_renew
  ) VALUES (
    NEW.tenant_id,
    NEW.id,
    'FREE',  -- Changed to FREE membership type
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '1 year',  -- Changed to 1 year
    false,  -- Not a trial, it's a full free membership
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create trial membership
DROP TRIGGER IF EXISTS trigger_create_trial_membership ON customers;
CREATE TRIGGER trigger_create_trial_membership
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_membership_for_customer();

-- ============================================================================
-- 9. CREATE FUNCTION TO CHECK MEMBERSHIP STATUS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_membership(p_customer_id UUID, p_tenant_id UUID)
RETURNS TABLE (
  membership_id UUID,
  membership_type VARCHAR(20),
  status VARCHAR(20),
  valid_until TIMESTAMPTZ,
  is_trial BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.membership_type,
    m.status,
    m.valid_until,
    m.is_trial,
    GREATEST(0, EXTRACT(DAY FROM (m.valid_until - NOW()))::INTEGER) as days_remaining
  FROM memberships m
  WHERE m.customer_id = p_customer_id
    AND m.tenant_id = p_tenant_id
    AND m.status = 'ACTIVE'
    AND m.valid_until > NOW()
  ORDER BY m.valid_until DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE FUNCTION TO CALCULATE CASHBACK
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_premium_cashback(
  p_tenant_id UUID,
  p_customer_id UUID,
  p_order_total_cents INTEGER,
  p_discount_amount_cents INTEGER,
  p_wallet_used_cents INTEGER
)
RETURNS TABLE (
  eligible_amount_cents INTEGER,
  cashback_rate_pct DECIMAL(5,2),
  cashback_earned_cents INTEGER,
  has_active_membership BOOLEAN
) AS $$
DECLARE
  v_membership_record RECORD;
  v_settings_record RECORD;
  v_eligible_amount INTEGER;
  v_cashback_amount INTEGER;
BEGIN
  -- Check for active membership
  SELECT * INTO v_membership_record
  FROM get_active_membership(p_customer_id, p_tenant_id)
  LIMIT 1;
  
  -- If no active membership, return zero cashback
  IF v_membership_record IS NULL THEN
    RETURN QUERY SELECT 0, 0.00::DECIMAL(5,2), 0, false;
    RETURN;
  END IF;
  
  -- Get cashback settings
  SELECT * INTO v_settings_record
  FROM cashback_settings
  WHERE tenant_id = p_tenant_id AND is_active = true
  LIMIT 1;
  
  -- If no settings found, use defaults
  IF v_settings_record IS NULL THEN
    v_settings_record.cashback_rate_pct := 5.00;
    v_settings_record.min_order_amount_cents := 50000;
    v_settings_record.max_cashback_per_order_cents := 50000;
  END IF;
  
  -- Calculate eligible amount (actual cash paid, excluding discounts and wallet)
  v_eligible_amount := p_order_total_cents - p_discount_amount_cents - p_wallet_used_cents;
  
  -- Check minimum order amount
  IF p_order_total_cents < v_settings_record.min_order_amount_cents THEN
    RETURN QUERY SELECT 0, v_settings_record.cashback_rate_pct, 0, true;
    RETURN;
  END IF;
  
  -- Calculate cashback amount
  v_cashback_amount := FLOOR(v_eligible_amount * v_settings_record.cashback_rate_pct / 100);
  
  -- Apply maximum cashback per order limit
  v_cashback_amount := LEAST(v_cashback_amount, v_settings_record.max_cashback_per_order_cents);
  
  RETURN QUERY SELECT 
    v_eligible_amount,
    v_settings_record.cashback_rate_pct,
    v_cashback_amount,
    true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. CREATE VIEW FOR MEMBERSHIP STATUS
-- ============================================================================
CREATE OR REPLACE VIEW v_customer_membership_status AS
SELECT 
  c.id as customer_id,
  c.tenant_id,
  c.email,
  c.first_name,
  c.last_name,
  m.id as membership_id,
  m.membership_type,
  m.status,
  m.valid_from,
  m.valid_until,
  m.is_trial,
  m.auto_renew,
  CASE 
    WHEN m.valid_until > NOW() AND m.status = 'ACTIVE' THEN true
    ELSE false
  END as is_active,
  GREATEST(0, EXTRACT(DAY FROM (m.valid_until - NOW()))::INTEGER) as days_remaining,
  CASE 
    WHEN m.valid_until <= NOW() + INTERVAL '7 days' AND m.status = 'ACTIVE' THEN true
    ELSE false
  END as expires_soon
FROM customers c
LEFT JOIN memberships m ON c.id = m.customer_id AND c.tenant_id = m.tenant_id
WHERE m.id IS NULL OR m.id = (
  SELECT id FROM memberships m2 
  WHERE m2.customer_id = c.id AND m2.tenant_id = c.tenant_id 
  ORDER BY m2.valid_until DESC 
  LIMIT 1
);

-- ============================================================================
-- 12. ENABLE RLS ON NEW TABLES
-- ============================================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic tenant isolation)
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY membership_payments_tenant_isolation ON membership_payments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY premium_cashback_tenant_isolation ON premium_cashback_transactions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY cashback_settings_tenant_isolation ON cashback_settings
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY membership_pricing_tenant_isolation ON membership_pricing
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);