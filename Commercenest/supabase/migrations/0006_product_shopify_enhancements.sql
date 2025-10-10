-- Add Shopify-like enhancements to products table
-- This migration adds fields for better pricing, shipping, and SEO management

-- Add new pricing fields
ALTER TABLE products 
ADD COLUMN compare_at_price_cents INTEGER,
ADD COLUMN cost_per_item_cents INTEGER;

-- Add shipping and tax fields
ALTER TABLE products 
ADD COLUMN requires_shipping BOOLEAN DEFAULT true,
ADD COLUMN taxable BOOLEAN DEFAULT true,
ADD COLUMN hs_code TEXT;

-- Add SEO fields
ALTER TABLE products 
ADD COLUMN seo_url TEXT;

-- Add inventory management fields
ALTER TABLE products 
ADD COLUMN allow_backorders BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN products.compare_at_price_cents IS 'Original price for discount display (stored in cents)';
COMMENT ON COLUMN products.cost_per_item_cents IS 'Cost price of the item (stored in cents)';
COMMENT ON COLUMN products.requires_shipping IS 'Whether this product requires shipping';
COMMENT ON COLUMN products.taxable IS 'Whether taxes should be charged on this product';
COMMENT ON COLUMN products.hs_code IS 'Harmonized System code for international shipping';
COMMENT ON COLUMN products.seo_url IS 'Custom URL handle for SEO';
COMMENT ON COLUMN products.allow_backorders IS 'Whether customers can purchase when out of stock';

-- Create index on seo_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_seo_url ON products(seo_url);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Tenant admins can view their products" ON products;
CREATE POLICY "Tenant admins can view their products" ON products
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role = 'tenant_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant admins can insert their products" ON products;
CREATE POLICY "Tenant admins can insert their products" ON products
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role = 'tenant_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant admins can update their products" ON products;
CREATE POLICY "Tenant admins can update their products" ON products
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role = 'tenant_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant admins can delete their products" ON products;
CREATE POLICY "Tenant admins can delete their products" ON products
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role = 'tenant_admin'
    )
  );
