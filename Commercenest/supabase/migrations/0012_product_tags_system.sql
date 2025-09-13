-- Migration: Product Tags System
-- Description: Implements flexible product tagging system for dynamic filtering

-- Add tags column to products table
ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create product_tags table for more advanced tagging (optional, for future use)
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'custom' CHECK (tag_type IN ('category', 'season', 'promotion', 'material', 'style', 'custom')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, product_id, tag_name)
);

-- Create indexes for performance
CREATE INDEX idx_product_tags_tenant_id ON product_tags(tenant_id);
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag_name ON product_tags(tag_name);
CREATE INDEX idx_product_tags_tag_type ON product_tags(tag_type);
CREATE INDEX idx_products_tags_gin ON products USING GIN(tags);

-- Create filter_presets table for admin-managed filter combinations
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  filter_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Create indexes for filter_presets
CREATE INDEX idx_filter_presets_tenant_id ON filter_presets(tenant_id);
CREATE INDEX idx_filter_presets_slug ON filter_presets(slug);
CREATE INDEX idx_filter_presets_active ON filter_presets(is_active);

-- Enable RLS
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_tags
CREATE POLICY "product_tags_tenant_isolation" ON product_tags
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "product_tags_tenant_admin_access" ON product_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = product_tags.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('tenant_admin', 'tenant_editor')
    )
  );

-- RLS Policies for filter_presets
CREATE POLICY "filter_presets_tenant_isolation" ON filter_presets
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "filter_presets_tenant_admin_access" ON filter_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = filter_presets.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('tenant_admin', 'tenant_editor')
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_tags_updated_at 
  BEFORE UPDATE ON product_tags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filter_presets_updated_at 
  BEFORE UPDATE ON filter_presets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed some example filter presets for Senlysh
INSERT INTO filter_presets (tenant_id, name, slug, description, filter_config, sort_order) VALUES
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'Featured Items',
  'featured',
  'Showcase featured products',
  '{"badges": {"is_featured": true}}',
  1
),
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'New Arrivals',
  'new-arrivals',
  'Latest products added to the store',
  '{"badges": {"is_new_arrival": true}}',
  2
),
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'Sale Items',
  'sale',
  'Products currently on sale',
  '{"badges": {"is_on_sale": true}}',
  3
),
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'Bestsellers',
  'bestsellers',
  'Top-selling products',
  '{"badges": {"is_bestseller": true}}',
  4
),
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'Rain Collection',
  'rain-collection',
  'Waterproof and rain-ready items',
  '{"tags": ["rain", "waterproof", "monsoon"]}',
  5
),
(
  (SELECT id FROM tenants WHERE name = 'Senlysh Fashion'),
  'Summer Vibes',
  'summer-vibes',
  'Light and breezy summer collection',
  '{"tags": ["summer", "light", "breezy"]}',
  6
);

-- Add some example tags to existing products
UPDATE products 
SET tags = ARRAY['rain', 'waterproof', 'outdoor']
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Senlysh Fashion')
AND name ILIKE '%rain%';

UPDATE products 
SET tags = ARRAY['summer', 'light', 'casual']
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Senlysh Fashion')
AND name ILIKE '%summer%';

-- Add tags to all products for demonstration
UPDATE products 
SET tags = ARRAY['fashion', 'clothing', 'trendy']
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Senlysh Fashion')
AND tags IS NULL OR array_length(tags, 1) IS NULL;















