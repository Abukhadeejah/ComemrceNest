-- Add variant pricing and inventory management
-- This migration adds support for variant-specific pricing and inventory

-- 1. Add missing columns to existing product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS cost_cents INTEGER,
ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- 3. RLS policies for product_variants (table already has RLS enabled)
-- Note: RLS policies are already created in previous migrations

-- 5. Add variant pricing to variant_option_values
ALTER TABLE variant_option_values 
ADD COLUMN IF NOT EXISTS price_adjustment_cents INTEGER DEFAULT 0, -- price adjustment for this option value
ADD COLUMN IF NOT EXISTS cost_adjustment_cents INTEGER DEFAULT 0; -- cost adjustment for this option value

-- 6. Add comments for documentation
COMMENT ON TABLE product_variants IS 'Individual product variants with specific pricing and inventory';
COMMENT ON COLUMN product_variants.name IS 'Display name for the variant (e.g., "Red - Large")';
COMMENT ON COLUMN product_variants.sku IS 'Unique SKU for this variant';
COMMENT ON COLUMN product_variants.price_cents IS 'Variant-specific selling price in cents';
COMMENT ON COLUMN product_variants.compare_at_price_cents IS 'Variant-specific compare price in cents';
COMMENT ON COLUMN product_variants.cost_cents IS 'Variant-specific cost price in cents';
COMMENT ON COLUMN product_variants.stock IS 'Variant-specific inventory count';
COMMENT ON COLUMN variant_option_values.price_adjustment_cents IS 'Price adjustment for this option value (can be positive or negative)';
COMMENT ON COLUMN variant_option_values.cost_adjustment_cents IS 'Cost adjustment for this option value (can be positive or negative)';

-- 7. Create function to calculate variant price from base product + adjustments
CREATE OR REPLACE FUNCTION calculate_variant_price(
    p_product_id UUID,
    p_variant_combinations JSONB
) RETURNS INTEGER AS $$
DECLARE
    base_price INTEGER;
    total_adjustment INTEGER := 0;
    option_value_id UUID;
BEGIN
    -- Get base product price
    SELECT price_cents INTO base_price
    FROM products
    WHERE id = p_product_id;
    
    -- Calculate total price adjustments from variant combinations
    FOR option_value_id IN 
        SELECT jsonb_array_elements_text(p_variant_combinations)::UUID
    LOOP
        SELECT COALESCE(total_adjustment, 0) + COALESCE(price_adjustment_cents, 0)
        INTO total_adjustment
        FROM variant_option_values
        WHERE id = option_value_id;
    END LOOP;
    
    RETURN base_price + total_adjustment;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to calculate variant cost from base product + adjustments
CREATE OR REPLACE FUNCTION calculate_variant_cost(
    p_product_id UUID,
    p_variant_combinations JSONB
) RETURNS INTEGER AS $$
DECLARE
    base_cost INTEGER;
    total_adjustment INTEGER := 0;
    option_value_id UUID;
BEGIN
    -- Get base product cost
    SELECT cost_per_item_cents INTO base_cost
    FROM products
    WHERE id = p_product_id;
    
    -- Calculate total cost adjustments from variant combinations
    FOR option_value_id IN 
        SELECT jsonb_array_elements_text(p_variant_combinations)::UUID
    LOOP
        SELECT COALESCE(total_adjustment, 0) + COALESCE(cost_adjustment_cents, 0)
        INTO total_adjustment
        FROM variant_option_values
        WHERE id = option_value_id;
    END LOOP;
    
    RETURN COALESCE(base_cost, 0) + total_adjustment;
END;
$$ LANGUAGE plpgsql;
