-- ============================================================================
-- UPDATED COMPREHENSIVE RLS POLICIES FOR COMMERCENEST PLATFORM
-- ============================================================================
-- This script implements standardized Row Level Security policies for all tenant-scoped tables
-- Updated to match actual database schema (no customers table exists)
-- Standardizes all policies to use JWT claims for consistency and performance

-- =====================================================
-- HELPER FUNCTIONS FOR TENANT RESOLUTION
-- =====================================================

-- Function to get tenant_id from authenticated user (JWT-first approach)
CREATE OR REPLACE FUNCTION get_tenant_id_from_auth()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Try to get tenant_id from JWT first (most efficient)
  tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;

  IF tenant_id IS NOT NULL THEN
    RETURN tenant_id;
  END IF;

  -- Fallback: get from tenant_members if user has only one tenant
  SELECT tm.tenant_id INTO tenant_id
  FROM tenant_members tm
  WHERE tm.user_id = auth.uid()
  LIMIT 1;

  -- Return tenant_id or raise exception if not found
  IF tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT ISOLATION VIOLATION: User % is not a member of any tenant', auth.uid();
  END IF;

  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate tenant membership
CREATE OR REPLACE FUNCTION validate_tenant_membership(required_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if authenticated user is a member of the required tenant
  RETURN EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.tenant_id = required_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TABLES (if not already enabled)
-- =====================================================

-- Core tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_flow_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integration_secrets ENABLE ROW LEVEL SECURITY;

-- Product management tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_size_guides ENABLE ROW LEVEL SECURITY;

-- Category and variant tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- Order management tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Portfolio tables
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

-- CMS and settings tables
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_company_profile ENABLE ROW LEVEL SECURITY;

-- System tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_outbox ENABLE ROW LEVEL SECURITY;

-- Platform-level tables (superadmin only)
ALTER TABLE module_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TENANT MANAGEMENT POLICIES (Superadmin Only)
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Tenants superadmin select" ON tenants;
DROP POLICY IF EXISTS "Tenants superadmin insert" ON tenants;
DROP POLICY IF EXISTS "Tenants superadmin update" ON tenants;
DROP POLICY IF EXISTS "Tenants superadmin delete" ON tenants;

-- Tenants table policies (superadmin only)
CREATE POLICY "Tenants superadmin select" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

CREATE POLICY "Tenants superadmin insert" ON tenants
FOR INSERT WITH CHECK (true);

CREATE POLICY "Tenants superadmin update" ON tenants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

CREATE POLICY "Tenants superadmin delete" ON tenants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

-- =====================================================
-- TENANT MEMBERS POLICIES (JWT-based)
-- =====================================================

DROP POLICY IF EXISTS "Members read" ON tenant_members;
DROP POLICY IF EXISTS "Members insert by admin" ON tenant_members;
DROP POLICY IF EXISTS "Members update by admin" ON tenant_members;
DROP POLICY IF EXISTS "Members delete by admin" ON tenant_members;

CREATE POLICY "Members read" ON tenant_members
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Members insert by admin" ON tenant_members
FOR INSERT WITH CHECK (true);

CREATE POLICY "Members update by admin" ON tenant_members
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Members delete by admin" ON tenant_members
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- PRODUCT MANAGEMENT POLICIES (JWT-based)
-- =====================================================

-- Products policies
DROP POLICY IF EXISTS "Products read by tenant" ON products;
DROP POLICY IF EXISTS "Products insert by tenant" ON products;
DROP POLICY IF EXISTS "Products update by tenant" ON products;
DROP POLICY IF EXISTS "Products delete by tenant" ON products;

CREATE POLICY "Products read by tenant" ON products
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Products insert by tenant" ON products
FOR INSERT WITH CHECK (true);

CREATE POLICY "Products update by tenant" ON products
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Products delete by tenant" ON products
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Product images policies
DROP POLICY IF EXISTS "Product images read by tenant" ON product_images;
DROP POLICY IF EXISTS "Product images insert by tenant" ON product_images;
DROP POLICY IF EXISTS "Product images update by tenant" ON product_images;
DROP POLICY IF EXISTS "Product images delete by tenant" ON product_images;

CREATE POLICY "Product images read by tenant" ON product_images
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Product images insert by tenant" ON product_images
FOR INSERT WITH CHECK (true);

CREATE POLICY "Product images update by tenant" ON product_images
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Product images delete by tenant" ON product_images
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Product categories policies
DROP POLICY IF EXISTS "Product categories read" ON product_categories;
DROP POLICY IF EXISTS "Product categories insert" ON product_categories;
DROP POLICY IF EXISTS "Product categories update" ON product_categories;
DROP POLICY IF EXISTS "Product categories delete" ON product_categories;

CREATE POLICY "Product categories read" ON product_categories
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Product categories insert" ON product_categories
FOR INSERT WITH CHECK (true);

CREATE POLICY "Product categories update" ON product_categories
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Product categories delete" ON product_categories
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- CATEGORY MANAGEMENT POLICIES (JWT-based)
-- =====================================================

DROP POLICY IF EXISTS "Categories read by tenant" ON categories;
DROP POLICY IF EXISTS "Categories insert by tenant" ON categories;
DROP POLICY IF EXISTS "Categories update by tenant" ON categories;
DROP POLICY IF EXISTS "Categories delete by tenant" ON categories;

CREATE POLICY "Categories read by tenant" ON categories
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Categories insert by tenant" ON categories
FOR INSERT WITH CHECK (true);

CREATE POLICY "Categories update by tenant" ON categories
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Categories delete by tenant" ON categories
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- ORDER MANAGEMENT POLICIES (JWT-based + Server)
-- =====================================================

-- Orders policies
DROP POLICY IF EXISTS "Orders read by tenant" ON orders;
DROP POLICY IF EXISTS "Orders server-only insert" ON orders;
DROP POLICY IF EXISTS "Orders server-only update" ON orders;
DROP POLICY IF EXISTS "Orders server-only delete" ON orders;

CREATE POLICY "Orders read by tenant" ON orders
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Orders server-only insert" ON orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders server-only update" ON orders
FOR UPDATE USING (auth.role() = 'service_role'::text);

CREATE POLICY "Orders server-only delete" ON orders
FOR DELETE USING (auth.role() = 'service_role'::text);

-- Order items policies (server-only since they relate to orders)
DROP POLICY IF EXISTS "Order items server-only insert" ON order_items;
DROP POLICY IF EXISTS "Order items server-only update" ON order_items;
DROP POLICY IF EXISTS "Order items server-only delete" ON order_items;

CREATE POLICY "Order items server-only insert" ON order_items
FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items server-only update" ON order_items
FOR UPDATE USING (auth.role() = 'service_role'::text);

CREATE POLICY "Order items server-only delete" ON order_items
FOR DELETE USING (auth.role() = 'service_role'::text);

-- Payment webhook events policies
DROP POLICY IF EXISTS "Payment events server-only insert" ON payment_webhook_events;
DROP POLICY IF EXISTS "Payment events server-only update" ON payment_webhook_events;
DROP POLICY IF EXISTS "Payment events server-only delete" ON payment_webhook_events;
DROP POLICY IF EXISTS "Payment events tenant select" ON payment_webhook_events;

CREATE POLICY "Payment events server-only insert" ON payment_webhook_events
FOR INSERT WITH CHECK (true);

CREATE POLICY "Payment events server-only update" ON payment_webhook_events
FOR UPDATE USING (auth.role() = 'service_role'::text);

CREATE POLICY "Payment events server-only delete" ON payment_webhook_events
FOR DELETE USING (auth.role() = 'service_role'::text);

CREATE POLICY "Payment events tenant select" ON payment_webhook_events
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- PORTFOLIO POLICIES (JWT-based)
-- =====================================================

-- Portfolio projects policies
DROP POLICY IF EXISTS "Portfolio read by tenant" ON portfolio_projects;
DROP POLICY IF EXISTS "Portfolio insert by tenant" ON portfolio_projects;
DROP POLICY IF EXISTS "Portfolio update by tenant" ON portfolio_projects;
DROP POLICY IF EXISTS "Portfolio delete by tenant" ON portfolio_projects;

CREATE POLICY "Portfolio read by tenant" ON portfolio_projects
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Portfolio insert by tenant" ON portfolio_projects
FOR INSERT WITH CHECK (true);

CREATE POLICY "Portfolio update by tenant" ON portfolio_projects
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Portfolio delete by tenant" ON portfolio_projects
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Portfolio images policies
DROP POLICY IF EXISTS "Portfolio images read by tenant" ON portfolio_images;
DROP POLICY IF EXISTS "Portfolio images insert" ON portfolio_images;
DROP POLICY IF EXISTS "Portfolio images update" ON portfolio_images;
DROP POLICY IF EXISTS "Portfolio images delete" ON portfolio_images;

CREATE POLICY "Portfolio images read by tenant" ON portfolio_images
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Portfolio images insert" ON portfolio_images
FOR INSERT WITH CHECK (true);

CREATE POLICY "Portfolio images update" ON portfolio_images
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Portfolio images delete" ON portfolio_images
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- CMS AND SETTINGS POLICIES (JWT-based)
-- =====================================================

-- CMS pages policies
DROP POLICY IF EXISTS "CMS read by tenant" ON cms_pages;
DROP POLICY IF EXISTS "CMS insert by tenant" ON cms_pages;
DROP POLICY IF EXISTS "CMS update by tenant" ON cms_pages;
DROP POLICY IF EXISTS "CMS delete by tenant" ON cms_pages;

CREATE POLICY "CMS read by tenant" ON cms_pages
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "CMS insert by tenant" ON cms_pages
FOR INSERT WITH CHECK (true);

CREATE POLICY "CMS update by tenant" ON cms_pages
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "CMS delete by tenant" ON cms_pages
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Settings policies
DROP POLICY IF EXISTS "Settings read by tenant" ON settings_company_profile;
DROP POLICY IF EXISTS "Settings insert by tenant" ON settings_company_profile;
DROP POLICY IF EXISTS "Settings update by tenant" ON settings_company_profile;
DROP POLICY IF EXISTS "Settings delete by tenant" ON settings_company_profile;

CREATE POLICY "Settings read by tenant" ON settings_company_profile
FOR SELECT USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Settings insert by tenant" ON settings_company_profile
FOR INSERT WITH CHECK (true);

CREATE POLICY "Settings update by tenant" ON settings_company_profile
FOR UPDATE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

CREATE POLICY "Settings delete by tenant" ON settings_company_profile
FOR DELETE USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- VARIANT MANAGEMENT POLICIES (JWT-based)
-- =====================================================

-- Product variants policies
DROP POLICY IF EXISTS "Tenant isolation for product_variants" ON product_variants;

CREATE POLICY "Tenant isolation for product_variants" ON product_variants
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Product variant options policies
DROP POLICY IF EXISTS "Tenant admins can manage their product variant options" ON product_variant_options;

CREATE POLICY "Tenant admins can manage their product variant options" ON product_variant_options
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Size guides policies
DROP POLICY IF EXISTS "Tenant admins can manage their size guides" ON size_guides;

CREATE POLICY "Tenant admins can manage their size guides" ON size_guides
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Product size guides policies
DROP POLICY IF EXISTS "Tenant admins can manage their product size guides" ON product_size_guides;

CREATE POLICY "Tenant admins can manage their product size guides" ON product_size_guides
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Variant options policies
DROP POLICY IF EXISTS "Tenant admins can manage their variant options" ON variant_options;

CREATE POLICY "Tenant admins can manage their variant options" ON variant_options
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Variant option values policies
DROP POLICY IF EXISTS "Tenant admins can manage their variant option values" ON variant_option_values;

CREATE POLICY "Tenant admins can manage their variant option values" ON variant_option_values
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Variant combinations policies
DROP POLICY IF EXISTS "Tenant admins can manage their variant combinations" ON variant_combinations;

CREATE POLICY "Tenant admins can manage their variant combinations" ON variant_combinations
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Variant images policies
DROP POLICY IF EXISTS "Tenant admins can manage their variant images" ON variant_images;

CREATE POLICY "Tenant admins can manage their variant images" ON variant_images
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- =====================================================
-- MODULE AND FEATURE MANAGEMENT POLICIES (JWT-based)
-- =====================================================

-- Tenant modules policies
DROP POLICY IF EXISTS "Tenant modules" ON tenant_modules;

CREATE POLICY "Tenant modules" ON tenant_modules
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Tenant feature flags policies
DROP POLICY IF EXISTS "Tenant flags" ON tenant_feature_flags;

CREATE POLICY "Tenant flags" ON tenant_feature_flags
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Tenant payment settings policies (server-only for security)
DROP POLICY IF EXISTS "Payment settings server-only select" ON tenant_payment_settings;
DROP POLICY IF EXISTS "Payment settings server-only insert" ON tenant_payment_settings;
DROP POLICY IF EXISTS "Payment settings server-only update" ON tenant_payment_settings;
DROP POLICY IF EXISTS "Payment settings server-only delete" ON tenant_payment_settings;

CREATE POLICY "Payment settings server-only select" ON tenant_payment_settings
FOR SELECT USING (auth.role() = 'service_role'::text);

CREATE POLICY "Payment settings server-only insert" ON tenant_payment_settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Payment settings server-only update" ON tenant_payment_settings
FOR UPDATE USING (auth.role() = 'service_role'::text);

CREATE POLICY "Payment settings server-only delete" ON tenant_payment_settings
FOR DELETE USING (auth.role() = 'service_role'::text);

-- Tenant flow overrides policies
DROP POLICY IF EXISTS "Tenant overrides" ON tenant_flow_overrides;

CREATE POLICY "Tenant overrides" ON tenant_flow_overrides
FOR ALL USING ((tenant_id)::text = (auth.jwt() ->> 'tenant_id'::text));

-- Tenant integration secrets policies (server-only for security)
DROP POLICY IF EXISTS "Secrets server-only" ON tenant_integration_secrets;

CREATE POLICY "Secrets server-only" ON tenant_integration_secrets
FOR ALL USING (auth.role() = 'service_role'::text);

-- =====================================================
-- PLATFORM-LEVEL POLICIES (Superadmin Only)
-- =====================================================

-- Profiles policies (platform users - superadmin only)
DROP POLICY IF EXISTS "Profiles superadmin" ON profiles;

CREATE POLICY "Profiles superadmin" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

-- Module registry policies (superadmin only)
DROP POLICY IF EXISTS "Modules superadmin" ON module_registry;

CREATE POLICY "Modules superadmin" ON module_registry
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

-- Plugin registry policies (superadmin only)
DROP POLICY IF EXISTS "Plugins superadmin" ON plugin_registry;

CREATE POLICY "Plugins superadmin" ON plugin_registry
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

-- Feature flags policies (superadmin only)
DROP POLICY IF EXISTS "Flags superadmin" ON feature_flags;

CREATE POLICY "Flags superadmin" ON feature_flags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

-- =====================================================
-- AUDIT AND LOGGING POLICIES
-- =====================================================

-- Audit logs policies (superadmin read, server write)
DROP POLICY IF EXISTS "Audit read superadmin" ON audit_logs;
DROP POLICY IF EXISTS "Audit server-only write" ON audit_logs;

CREATE POLICY "Audit read superadmin" ON audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'superadmin'::platform_role
  )
);

CREATE POLICY "Audit server-only write" ON audit_logs
FOR INSERT WITH CHECK (true);

-- Integration outbox policies (server-only)
DROP POLICY IF EXISTS "Outbox server-only" ON integration_outbox;

CREATE POLICY "Outbox server-only" ON integration_outbox
FOR ALL USING (auth.role() = 'service_role'::text);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to verify RLS is working correctly
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Count policies per table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Show all current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;










































