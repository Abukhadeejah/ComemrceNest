-- Fashion-specific enhancements for product variants and size guides
-- This migration adds comprehensive support for fashion stores

-- 1. Create variant options table (for Size, Color, Material, etc.)
CREATE TABLE IF NOT EXISTS variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Size", "Color", "Material"
    display_name TEXT NOT NULL, -- e.g., "Size", "Color", "Material"
    type TEXT NOT NULL CHECK (type IN ('text', 'color', 'image', 'select')),
    required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create variant option values table
CREATE TABLE IF NOT EXISTS variant_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- e.g., "Red", "XL", "Cotton"
    display_value TEXT NOT NULL, -- e.g., "Red", "XL", "100% Cotton"
    color_hex TEXT, -- for color swatches
    image_url TEXT, -- for color/material swatches
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create product variant options (links products to their available options)
CREATE TABLE IF NOT EXISTS product_variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, option_id)
);

-- 4. Create variant combinations table (actual variants with specific option combinations)
CREATE TABLE IF NOT EXISTS variant_combinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES variant_option_values(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(variant_id, option_id)
);

-- 5. Create size guides table
CREATE TABLE IF NOT EXISTS size_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "US Women's Clothing", "EU Men's Shoes"
    category TEXT NOT NULL, -- e.g., "clothing", "shoes", "accessories"
    gender TEXT, -- e.g., "men", "women", "unisex"
    measurements JSONB NOT NULL, -- structured measurement data
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create product size guides (links products to their size guides)
CREATE TABLE IF NOT EXISTS product_size_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_guide_id UUID NOT NULL REFERENCES size_guides(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, size_guide_id)
);

-- 7. Add fashion-specific fields to products table
ALTER TABLE products
ADD COLUMN material_composition TEXT,
ADD COLUMN care_instructions TEXT,
ADD COLUMN fit_type TEXT CHECK (fit_type IN ('slim', 'regular', 'loose', 'oversized')),
ADD COLUMN model_height_cm INTEGER,
ADD COLUMN model_weight_kg INTEGER,
ADD COLUMN model_wearing_size TEXT,
ADD COLUMN is_gift_card BOOLEAN DEFAULT false,
ADD COLUMN gift_card_amount_cents INTEGER,
ADD COLUMN gift_card_expiry_days INTEGER;

-- 8. Add variant-specific images table
CREATE TABLE IF NOT EXISTS variant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_variant_options_tenant ON variant_options(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variant_option_values_tenant ON variant_option_values(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variant_option_values_option ON variant_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_options_product ON product_variant_options(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_combinations_variant ON variant_combinations(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_combinations_product ON variant_combinations(product_id);
CREATE INDEX IF NOT EXISTS idx_size_guides_tenant ON size_guides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_size_guides_product ON product_size_guides(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON variant_images(variant_id);

-- 10. Add RLS policies
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for variant_options
CREATE POLICY "Tenant admins can manage their variant options" ON variant_options
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for variant_option_values
CREATE POLICY "Tenant admins can manage their variant option values" ON variant_option_values
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for product_variant_options
CREATE POLICY "Tenant admins can manage their product variant options" ON product_variant_options
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for variant_combinations
CREATE POLICY "Tenant admins can manage their variant combinations" ON variant_combinations
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for size_guides
CREATE POLICY "Tenant admins can manage their size guides" ON size_guides
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for product_size_guides
CREATE POLICY "Tenant admins can manage their product size guides" ON product_size_guides
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- RLS policies for variant_images
CREATE POLICY "Tenant admins can manage their variant images" ON variant_images
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- 11. Add comments for documentation
COMMENT ON TABLE variant_options IS 'Defines available variant options like Size, Color, Material';
COMMENT ON TABLE variant_option_values IS 'Specific values for variant options like Red, XL, Cotton';
COMMENT ON TABLE product_variant_options IS 'Links products to their available variant options';
COMMENT ON TABLE variant_combinations IS 'Defines specific variant combinations with option values';
COMMENT ON TABLE size_guides IS 'Size measurement guides for different product categories';
COMMENT ON TABLE product_size_guides IS 'Links products to their applicable size guides';
COMMENT ON TABLE variant_images IS 'Images specific to product variants';
COMMENT ON COLUMN products.material_composition IS 'Material composition (e.g., 100% Cotton)';
COMMENT ON COLUMN products.care_instructions IS 'Care and washing instructions';
COMMENT ON COLUMN products.fit_type IS 'Fit type for clothing items';
COMMENT ON COLUMN products.model_height_cm IS 'Model height in centimeters for size reference';
COMMENT ON COLUMN products.model_weight_kg IS 'Model weight in kg for size reference';
COMMENT ON COLUMN products.model_wearing_size IS 'Size the model is wearing in photos';
COMMENT ON COLUMN products.is_gift_card IS 'Whether this product is a gift card';
COMMENT ON COLUMN products.gift_card_amount_cents IS 'Gift card amount in cents';
COMMENT ON COLUMN products.gift_card_expiry_days IS 'Days until gift card expires';
