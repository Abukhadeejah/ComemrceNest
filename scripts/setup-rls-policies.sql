
-- ============================================================================
-- UPDATED COMPREHENSIVE RLS POLICIES FOR COMMERCENEST PLATFORM
-- ============================================================================
-- This script implements Row Level Security policies for all tenant-scoped tables
-- Updated to match actual database schema and remove non-existent tables

-- Enable RLS on all tenant-scoped tables (keeping existing RLS-enabled tables)
-- Note: Most tables already have RLS enabled based on Supabase MCP query

-- ============================================================================
-- HELPER FUNCTIONS FOR TENANT RESOLUTION
-- ============================================================================

-- Function to get tenant_id from authenticated user
CREATE OR REPLACE FUNCTION get_tenant_id_from_auth()
RETURNS UUID AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Get tenant_id from authenticated user's profile
  SELECT tm.tenant_id INTO user_tenant_id
  FROM tenant_members tm
  WHERE tm.user_id = auth.uid()
  LIMIT 1;

  -- Return tenant_id or raise exception if not found
  IF user_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT ISOLATION VIOLATION: User % is not a member of any tenant', auth.uid();
  END IF;

  RETURN user_tenant_id;
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

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Allow tenant admins to manage their own products
CREATE POLICY "tenant_products_select" ON products
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_products_insert" ON products
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_products_update" ON products
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_products_delete" ON products
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

CREATE POLICY "tenant_categories_select" ON categories
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_categories_insert" ON categories
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_categories_update" ON categories
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_categories_delete" ON categories
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "tenant_orders_select" ON orders
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_orders_insert" ON orders
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_orders_update" ON orders
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_orders_delete" ON orders
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================

CREATE POLICY "tenant_order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_order_items_update" ON order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_order_items_delete" ON order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.tenant_id = get_tenant_id_from_auth()
    )
  );

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "tenant_customers_select" ON customers
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_customers_insert" ON customers
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_customers_update" ON customers
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_customers_delete" ON customers
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- ============================================================================
-- SETTINGS POLICIES
-- ============================================================================

CREATE POLICY "tenant_settings_select" ON settings_company_profile
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_settings_insert" ON settings_company_profile
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_settings_update" ON settings_company_profile
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_settings_delete" ON settings_company_profile
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- ============================================================================
-- VARIANT-RELATED POLICIES
-- ============================================================================

-- Variant Options
CREATE POLICY "tenant_variant_options_select" ON variant_options
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_variant_options_insert" ON variant_options
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_variant_options_update" ON variant_options
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_variant_options_delete" ON variant_options
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

-- Variant Option Values
CREATE POLICY "tenant_variant_values_select" ON variant_option_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM variant_options vo
      WHERE vo.id = variant_option_values.option_id
      AND vo.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_variant_values_insert" ON variant_option_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM variant_options vo
      WHERE vo.id = variant_option_values.option_id
      AND vo.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_variant_values_update" ON variant_option_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM variant_options vo
      WHERE vo.id = variant_option_values.option_id
      AND vo.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_variant_values_delete" ON variant_option_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM variant_options vo
      WHERE vo.id = variant_option_values.option_id
      AND vo.tenant_id = get_tenant_id_from_auth()
    )
  );

-- Product Variants
CREATE POLICY "tenant_product_variants_select" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_variants_insert" ON product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_variants_update" ON product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_variants_delete" ON product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

-- ============================================================================
-- RELATIONSHIP TABLES POLICIES
-- ============================================================================

-- Product Categories
CREATE POLICY "tenant_product_categories_select" ON product_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_categories.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_categories_insert" ON product_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_categories.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_categories_update" ON product_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_categories.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_categories_delete" ON product_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_categories.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

-- Product Images
CREATE POLICY "tenant_product_images_select" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_images_insert" ON product_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_images_update" ON product_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_product_images_delete" ON product_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.tenant_id = get_tenant_id_from_auth()
    )
  );

-- ============================================================================
-- TENANT MANAGEMENT POLICIES
-- ============================================================================

-- Tenant Members (users can only see their own membership)
CREATE POLICY "tenant_members_select" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tenant_members_insert" ON tenant_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tenant_members_update" ON tenant_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "tenant_members_delete" ON tenant_members
  FOR DELETE USING (user_id = auth.uid());

-- Tenant Modules (users can only see modules for tenants they belong to)
CREATE POLICY "tenant_modules_select" ON tenant_modules
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_modules_insert" ON tenant_modules
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_modules_update" ON tenant_modules
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_modules_delete" ON tenant_modules
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- Tenant Feature Flags
CREATE POLICY "tenant_feature_flags_select" ON tenant_feature_flags
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_feature_flags_insert" ON tenant_feature_flags
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_feature_flags_update" ON tenant_feature_flags
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "tenant_feature_flags_delete" ON tenant_feature_flags
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- PORTFOLIO POLICIES
-- ============================================================================

CREATE POLICY "tenant_portfolio_select" ON portfolio_projects
  FOR SELECT USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_portfolio_insert" ON portfolio_projects
  FOR INSERT WITH CHECK (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_portfolio_update" ON portfolio_projects
  FOR UPDATE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_portfolio_delete" ON portfolio_projects
  FOR DELETE USING (tenant_id = get_tenant_id_from_auth());

CREATE POLICY "tenant_portfolio_images_select" ON portfolio_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolio_projects pp
      WHERE pp.id = portfolio_images.project_id
      AND pp.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_portfolio_images_insert" ON portfolio_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_projects pp
      WHERE pp.id = portfolio_images.project_id
      AND pp.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_portfolio_images_update" ON portfolio_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolio_projects pp
      WHERE pp.id = portfolio_images.project_id
      AND pp.tenant_id = get_tenant_id_from_auth()
    )
  );

CREATE POLICY "tenant_portfolio_images_delete" ON portfolio_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM portfolio_projects pp
      WHERE pp.id = portfolio_images.project_id
      AND pp.tenant_id = get_tenant_id_from_auth()
    )
  );

-- ============================================================================
-- AUDIT LOGS POLICIES (Super Admin Only)
-- ============================================================================

-- Only super admins can access audit logs
CREATE POLICY "super_admin_audit_logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

-- ============================================================================
-- TENANTS TABLE POLICIES (Super Admin Only)
-- ============================================================================

-- Only super admins can manage tenants
CREATE POLICY "super_admin_tenants_select" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_tenants_insert" ON tenants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_tenants_update" ON tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_tenants_delete" ON tenants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

-- ============================================================================
-- FEATURE FLAGS TABLE POLICIES (Super Admin Only)
-- ============================================================================

CREATE POLICY "super_admin_feature_flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'super_admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Query to verify RLS is working correctly
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('products', 'orders', 'customers', 'categories')
-- ORDER BY tablename;

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
