-- =====================================================
-- CREATE TENANT MODULES TABLE
-- =====================================================
-- Purpose: Enable/disable admin modules per tenant
-- Required for: Coupon system, other admin modules
-- =====================================================

-- Create tenant_modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_tenant_module UNIQUE (tenant_id, module_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_enabled ON tenant_modules(tenant_id, enabled);

-- Enable RLS
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation_tenant_modules ON tenant_modules
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Enable coupon module for all existing tenants
INSERT INTO tenant_modules (tenant_id, module_key, enabled, created_at)
SELECT 
  id as tenant_id,
  'coupons' as module_key,
  true as enabled,
  NOW() as created_at
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_modules 
  WHERE tenant_id = tenants.id AND module_key = 'coupons'
);

-- Enable other common modules for existing tenants
INSERT INTO tenant_modules (tenant_id, module_key, enabled, created_at)
SELECT 
  tenants.id as tenant_id,
  modules.module_key,
  true as enabled,
  NOW() as created_at
FROM tenants
CROSS JOIN (
  VALUES 
    ('products'),
    ('categories'),
    ('orders'),
    ('customers'),
    ('analytics'),
    ('settings')
) AS modules(module_key)
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_modules 
  WHERE tenant_id = tenants.id AND module_key = modules.module_key
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tenant_modules_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_modules_timestamp
  BEFORE UPDATE ON tenant_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_modules_timestamp();

COMMENT ON TABLE tenant_modules IS 'Controls which admin modules are enabled for each tenant';