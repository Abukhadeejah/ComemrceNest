-- Add granular customer modules for SaaS subscription model
-- This breaks down the customer system into smaller, purchasable modules

-- Insert granular customer modules into module registry
INSERT INTO module_registry (module_key, version, status, description, metadata) VALUES 
('customer_registration', 'v1', 'active', 'Customer registration and authentication', '{"features": ["registration", "login", "profile_management"], "tier": "basic", "price_monthly": 29, "price_yearly": 290}'),
('customer_addresses', 'v1', 'active', 'Customer address management', '{"features": ["address_crud", "default_address"], "tier": "basic", "price_monthly": 19, "price_yearly": 190}'),
('customer_wallet', 'v1', 'active', 'Digital wallet and cashback system', '{"features": ["wallet_balance", "transaction_history", "cashback"], "tier": "premium", "price_monthly": 49, "price_yearly": 490}'),
('customer_coupons', 'v1', 'active', 'Coupon and discount management', '{"features": ["coupon_creation", "redemption_tracking"], "tier": "premium", "price_monthly": 39, "price_yearly": 390}'),
('customer_analytics', 'v1', 'active', 'Customer behavior analytics', '{"features": ["purchase_history", "engagement_metrics"], "tier": "premium", "price_monthly": 59, "price_yearly": 590}')
ON CONFLICT (module_key) DO NOTHING;

-- Update existing customers module to be a bundle
UPDATE module_registry 
SET metadata = '{"features": ["registration", "login", "profile_management", "address_crud", "default_address"], "tier": "basic", "price_monthly": 39, "price_yearly": 390, "is_bundle": true, "includes": ["customer_registration", "customer_addresses"]}'
WHERE module_key = 'customers';

-- Create a premium customer bundle
INSERT INTO module_registry (module_key, version, status, description, metadata) VALUES 
('customers_premium', 'v1', 'active', 'Complete customer management suite', '{"features": ["registration", "login", "profile_management", "address_crud", "default_address", "wallet_balance", "transaction_history", "cashback", "coupon_creation", "redemption_tracking", "purchase_history", "engagement_metrics"], "tier": "premium", "price_monthly": 99, "price_yearly": 990, "is_bundle": true, "includes": ["customer_registration", "customer_addresses", "customer_wallet", "customer_coupons", "customer_analytics"]}')
ON CONFLICT (module_key) DO NOTHING;

-- Add module dependencies table for better management
CREATE TABLE IF NOT EXISTS public.module_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL REFERENCES public.module_registry(module_key) ON DELETE CASCADE,
  depends_on text NOT NULL REFERENCES public.module_registry(module_key) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies for module_dependencies
ALTER TABLE public.module_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies for module_dependencies
DROP POLICY IF EXISTS "module_dependencies_admin_read" ON public.module_dependencies;
CREATE POLICY "module_dependencies_admin_read" ON public.module_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'tenant_admin'
    )
  );

-- Add module dependencies
INSERT INTO module_dependencies (module_key, depends_on, is_required) VALUES 
('customer_addresses', 'customer_registration', true),
('customer_wallet', 'customer_registration', true),
('customer_coupons', 'customer_registration', true),
('customer_analytics', 'customer_registration', true),
('customers_premium', 'customer_registration', true),
('customers_premium', 'customer_addresses', true),
('customers_premium', 'customer_wallet', true),
('customers_premium', 'customer_coupons', true),
('customers_premium', 'customer_analytics', true);

-- Add module feature flags for granular control
CREATE TABLE IF NOT EXISTS public.module_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL REFERENCES public.module_registry(module_key) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  description text,
  is_core boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_key, feature_key)
);

-- Add RLS policies for module_features
ALTER TABLE public.module_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_features_admin_read" ON public.module_features;
CREATE POLICY "module_features_admin_read" ON public.module_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'tenant_admin'
    )
  );

-- Insert module features
INSERT INTO module_features (module_key, feature_key, feature_name, description, is_core) VALUES 
-- Customer Registration Features
('customer_registration', 'email_registration', 'Email Registration', 'Allow customers to register with email and password', true),
('customer_registration', 'phone_registration', 'Phone Registration', 'Allow customers to register with phone number', false),
('customer_registration', 'social_login', 'Social Login', 'Allow customers to register/login with social providers', false),
('customer_registration', 'profile_management', 'Profile Management', 'Allow customers to manage their profile information', true),

-- Customer Addresses Features
('customer_addresses', 'address_crud', 'Address CRUD', 'Create, read, update, delete customer addresses', true),
('customer_addresses', 'default_address', 'Default Address', 'Set and manage default shipping address', true),
('customer_addresses', 'address_validation', 'Address Validation', 'Validate addresses using external services', false),

-- Customer Wallet Features
('customer_wallet', 'wallet_balance', 'Wallet Balance', 'Track and display wallet balance', true),
('customer_wallet', 'transaction_history', 'Transaction History', 'View detailed transaction history', true),
('customer_wallet', 'cashback_earnings', 'Cashback Earnings', 'Automatic cashback on purchases', false),
('customer_wallet', 'wallet_transfer', 'Wallet Transfer', 'Transfer funds between wallets', false),

-- Customer Coupons Features
('customer_coupons', 'coupon_creation', 'Coupon Creation', 'Create and manage discount coupons', true),
('customer_coupons', 'redemption_tracking', 'Redemption Tracking', 'Track coupon usage and redemptions', true),
('customer_coupons', 'bulk_coupons', 'Bulk Coupons', 'Create bulk coupon campaigns', false),

-- Customer Analytics Features
('customer_analytics', 'purchase_history', 'Purchase History', 'Detailed customer purchase history', true),
('customer_analytics', 'engagement_metrics', 'Engagement Metrics', 'Customer engagement and behavior metrics', false),
('customer_analytics', 'lifetime_value', 'Lifetime Value', 'Calculate customer lifetime value', false);

-- Add function to check if a specific feature is enabled for a tenant
CREATE OR REPLACE FUNCTION is_module_feature_enabled(tenant_id_param uuid, module_key_param text, feature_key_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM tenant_modules tm
    JOIN module_features mf ON tm.module_key = mf.module_key
    WHERE tm.tenant_id = tenant_id_param
    AND tm.module_key = module_key_param
    AND mf.feature_key = feature_key_param
    AND tm.enabled = true
  );
END;
$$;

-- Add function to get all enabled features for a tenant
CREATE OR REPLACE FUNCTION get_tenant_enabled_features(tenant_id_param uuid)
RETURNS TABLE(module_key text, feature_key text, feature_name text, description text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT mf.module_key, mf.feature_key, mf.feature_name, mf.description
  FROM tenant_modules tm
  JOIN module_features mf ON tm.module_key = mf.module_key
  WHERE tm.tenant_id = tenant_id_param
  AND tm.enabled = true
  ORDER BY mf.module_key, mf.feature_key;
END;
$$;



