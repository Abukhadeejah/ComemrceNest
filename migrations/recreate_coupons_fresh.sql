-- =====================================================
-- DROP AND RECREATE COUPONS SYSTEM
-- =====================================================
-- WARNING: This will DELETE ALL existing coupon data!
-- Only run this if you want a fresh start
-- =====================================================

-- Drop existing tables and dependencies
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS validate_coupon CASCADE;
DROP FUNCTION IF EXISTS get_coupon_stats CASCADE;
DROP FUNCTION IF EXISTS update_coupon_timestamp CASCADE;

-- =====================================================
-- CREATE COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Coupon identification
  code VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount_cents INTEGER,
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Usage restrictions
  min_order_value_cents INTEGER DEFAULT 0,
  max_uses INTEGER,
  uses_per_customer INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_coupon_code_per_tenant UNIQUE (tenant_id, code),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
  CONSTRAINT valid_max_discount CHECK (
    discount_type = 'fixed' OR max_discount_cents IS NULL OR max_discount_cents > 0
  )
);

-- =====================================================
-- CREATE COUPON USAGE TABLE
-- =====================================================
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Discount applied
  discount_amount_cents INTEGER NOT NULL,
  order_total_cents INTEGER NOT NULL,
  
  -- Metadata
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_coupon_per_order UNIQUE (order_id)
);

-- =====================================================
-- ADD COUPON FIELDS TO ORDERS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
    ALTER TABLE orders ADD COLUMN coupon_id UUID REFERENCES coupons(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'discount_amount_cents') THEN
    ALTER TABLE orders ADD COLUMN discount_amount_cents INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX idx_coupons_code ON coupons(tenant_id, code);
CREATE INDEX idx_coupons_active ON coupons(tenant_id, is_active);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_customer ON coupon_usage(tenant_id, customer_id);
CREATE INDEX idx_orders_coupon ON orders(coupon_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================
CREATE POLICY tenant_isolation_coupons ON coupons
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_coupon_usage ON coupon_usage
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_tenant_id UUID,
  p_coupon_code VARCHAR(50),
  p_customer_id UUID,
  p_order_total_cents INTEGER
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  coupon_id UUID,
  discount_amount_cents INTEGER,
  discount_type VARCHAR(20),
  discount_value DECIMAL(10, 2)
) AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_customer_usage_count INTEGER;
  v_calculated_discount INTEGER;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE tenant_id = p_tenant_id
    AND UPPER(code) = UPPER(p_coupon_code)
    AND is_active = true;
  
  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or inactive coupon code', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Check validity period
  IF NOW() < v_coupon.valid_from THEN
    RETURN QUERY SELECT false, 'Coupon is not yet valid', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  IF NOW() > v_coupon.valid_until THEN
    RETURN QUERY SELECT false, 'Coupon has expired', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Check minimum order value
  IF p_order_total_cents < v_coupon.min_order_value_cents THEN
    RETURN QUERY SELECT 
      false, 
      format('Minimum order value of ₹%s required', (v_coupon.min_order_value_cents / 100.0)::TEXT),
      NULL::UUID, 
      0, 
      NULL::VARCHAR, 
      NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Check total usage limit
  IF v_coupon.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage
    WHERE coupon_id = v_coupon.id;
    
    IF v_usage_count >= v_coupon.max_uses THEN
      RETURN QUERY SELECT false, 'Coupon usage limit reached', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;
  
  -- Check per-customer usage limit
  SELECT COUNT(*) INTO v_customer_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id
    AND customer_id = p_customer_id;
  
  IF v_customer_usage_count >= v_coupon.uses_per_customer THEN
    RETURN QUERY SELECT false, 'You have already used this coupon', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF v_coupon.discount_type = 'percentage' THEN
    v_calculated_discount := ROUND((p_order_total_cents * v_coupon.discount_value / 100)::NUMERIC);
    
    -- Apply max discount cap if set
    IF v_coupon.max_discount_cents IS NOT NULL AND v_calculated_discount > v_coupon.max_discount_cents THEN
      v_calculated_discount := v_coupon.max_discount_cents;
    END IF;
  ELSE
    -- Fixed discount
    v_calculated_discount := ROUND((v_coupon.discount_value * 100)::NUMERIC);
  END IF;
  
  -- Ensure discount doesn't exceed order total
  IF v_calculated_discount > p_order_total_cents THEN
    v_calculated_discount := p_order_total_cents;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT 
    true,
    NULL::TEXT,
    v_coupon.id,
    v_calculated_discount,
    v_coupon.discount_type,
    v_coupon.discount_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get coupon statistics
CREATE OR REPLACE FUNCTION get_coupon_stats(p_coupon_id UUID)
RETURNS TABLE (
  total_uses BIGINT,
  total_discount_given_cents BIGINT,
  unique_customers BIGINT,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_uses,
    SUM(discount_amount_cents)::BIGINT as total_discount_given_cents,
    COUNT(DISTINCT customer_id)::BIGINT as unique_customers,
    MAX(used_at) as last_used_at
  FROM coupon_usage
  WHERE coupon_id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_coupon_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coupons_timestamp
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupon_timestamp();

-- =====================================================
-- ADD COMMENTS
-- =====================================================
COMMENT ON TABLE coupons IS 'Discount coupons that can be applied to orders';
COMMENT ON TABLE coupon_usage IS 'Tracks when and by whom coupons are used';
COMMENT ON FUNCTION validate_coupon IS 'Validates a coupon code and calculates discount amount';
COMMENT ON FUNCTION get_coupon_stats IS 'Returns usage statistics for a specific coupon';
