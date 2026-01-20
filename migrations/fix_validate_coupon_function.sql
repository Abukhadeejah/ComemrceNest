-- Fix ambiguous column references and discount calculation in validate_coupon function
-- Ensures table columns are fully qualified and discount_value handles both stored formats

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
  v_discount_pct DECIMAL(10, 2);
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE coupons.tenant_id = p_tenant_id
    AND UPPER(coupons.code) = UPPER(p_coupon_code)
    AND coupons.is_active = true;
  
  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RAISE NOTICE '[validate_coupon] Coupon not found: code=%, tenant_id=%', p_coupon_code, p_tenant_id;
    RETURN QUERY SELECT false, 'Invalid or inactive coupon code', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  RAISE NOTICE '[validate_coupon] Coupon found: code=%, discount_type=%, discount_value=%, tenant_id=%', 
    v_coupon.code, v_coupon.discount_type, v_coupon.discount_value, p_tenant_id;
  RAISE NOTICE '[validate_coupon] Order details: order_total_cents=%, customer_id=%', p_order_total_cents, p_customer_id;
  
  -- Check validity period
  IF NOW() < v_coupon.valid_from THEN
    RAISE NOTICE '[validate_coupon] Coupon not yet valid: valid_from=%', v_coupon.valid_from;
    RETURN QUERY SELECT false, 'Coupon is not yet valid', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  IF NOW() > v_coupon.valid_until THEN
    RAISE NOTICE '[validate_coupon] Coupon expired: valid_until=%', v_coupon.valid_until;
    RETURN QUERY SELECT false, 'Coupon has expired', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Check minimum order value
  IF p_order_total_cents < v_coupon.min_order_value_cents THEN
    RAISE NOTICE '[validate_coupon] Order below minimum: % cents < % cents', 
      p_order_total_cents, v_coupon.min_order_value_cents;
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
    WHERE coupon_usage.coupon_id = v_coupon.id;
    
    RAISE NOTICE '[validate_coupon] Usage check: current_uses=%, max_uses=%', v_usage_count, v_coupon.max_uses;
    
    IF v_usage_count >= v_coupon.max_uses THEN
      RAISE NOTICE '[validate_coupon] Coupon usage limit reached: % >= %', v_usage_count, v_coupon.max_uses;
      RETURN QUERY SELECT false, 'Coupon usage limit reached', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
      RETURN;
    END IF;
  END IF;
  
  -- Check per-customer usage limit
  SELECT COUNT(*) INTO v_customer_usage_count
  FROM coupon_usage
  WHERE coupon_usage.coupon_id = v_coupon.id
    AND coupon_usage.customer_id = p_customer_id;
  
  RAISE NOTICE '[validate_coupon] Customer usage check: customer_id=%, current_uses=%, max_per_customer=%', 
    p_customer_id, v_customer_usage_count, v_coupon.uses_per_customer;
  
  IF v_customer_usage_count >= v_coupon.uses_per_customer THEN
    RAISE NOTICE '[validate_coupon] Customer usage limit reached: % >= %', 
      v_customer_usage_count, v_coupon.uses_per_customer;
    RETURN QUERY SELECT false, 'You have already used this coupon', NULL::UUID, 0, NULL::VARCHAR, NULL::DECIMAL;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF v_coupon.discount_type = 'percentage' THEN
    -- Handle both cases: discount_value stored as 32 (32%) or 0.32 (0.32%)
    -- If value > 1, treat as percentage (e.g., 32 = 32%)
    -- If value <= 1, treat as decimal (e.g., 0.32 = 32%)
    v_discount_pct := CASE 
      WHEN v_coupon.discount_value > 1 THEN v_coupon.discount_value
      ELSE v_coupon.discount_value * 100
    END;
    
    RAISE NOTICE '[validate_coupon] Percentage calculation: raw_discount_value=%, v_discount_pct=%, order_total_cents=%', 
      v_coupon.discount_value, v_discount_pct, p_order_total_cents;
    
    v_calculated_discount := ROUND((p_order_total_cents * v_discount_pct / 100)::NUMERIC);
    
    RAISE NOTICE '[validate_coupon] Discount amount calculated: (% * % / 100) = % cents', 
      p_order_total_cents, v_discount_pct, v_calculated_discount;
    
    -- Apply max discount cap if set
    IF v_coupon.max_discount_cents IS NOT NULL AND v_calculated_discount > v_coupon.max_discount_cents THEN
      RAISE NOTICE '[validate_coupon] Discount capped: % cents -> % cents (max_discount_cents=%)', 
        v_calculated_discount, v_coupon.max_discount_cents, v_coupon.max_discount_cents;
      v_calculated_discount := v_coupon.max_discount_cents;
    END IF;
  ELSE
    -- Fixed discount: stored in rupees, convert to paise
    RAISE NOTICE '[validate_coupon] Fixed discount: raw_discount_value=%, converting to cents', v_coupon.discount_value;
    v_calculated_discount := ROUND((v_coupon.discount_value * 100)::NUMERIC);
    RAISE NOTICE '[validate_coupon] Fixed discount calculated: % rupees * 100 = % cents', v_coupon.discount_value, v_calculated_discount;
  END IF;
  
  -- Ensure discount doesn't exceed order total
  IF v_calculated_discount > p_order_total_cents THEN
    RAISE NOTICE '[validate_coupon] Discount exceeds order total: % cents > % cents. Capping to order total.', 
      v_calculated_discount, p_order_total_cents;
    v_calculated_discount := p_order_total_cents;
  END IF;
  
  RAISE NOTICE '[validate_coupon] FINAL RESULT: valid=true, discount_amount_cents=%, discount_type=%, discount_value=%', 
    v_calculated_discount, v_coupon.discount_type, v_coupon.discount_value;  
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