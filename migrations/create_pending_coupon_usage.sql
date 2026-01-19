-- Migration: Create pending_coupon_usage table for recording coupon usage after payment success
-- This table stores coupon data from checkout until webhook confirms payment

CREATE TABLE IF NOT EXISTS pending_coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  customer_id UUID NOT NULL,
  discount_amount_cents INTEGER NOT NULL DEFAULT 0,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  CONSTRAINT pending_coupon_usage_order_unique UNIQUE(tenant_id, order_id)
);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_pending_coupon_usage_order 
  ON pending_coupon_usage(tenant_id, order_id, processed);

-- Index for cleanup/monitoring
CREATE INDEX IF NOT EXISTS idx_pending_coupon_usage_created 
  ON pending_coupon_usage(created_at) WHERE processed = FALSE;

-- RLS Policies
ALTER TABLE pending_coupon_usage ENABLE ROW LEVEL SECURITY;

-- Admin can manage all pending usage for their tenant
CREATE POLICY "Admins manage pending coupon usage"
  ON pending_coupon_usage
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- System can process (service role)
-- No customer-facing policy needed (customers never query this directly)

COMMENT ON TABLE pending_coupon_usage IS 'Temporary storage for coupon usage data until payment webhook confirms order completion';
COMMENT ON COLUMN pending_coupon_usage.processed IS 'Set to TRUE after webhook records usage in coupon_usage table';
