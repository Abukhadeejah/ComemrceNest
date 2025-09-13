-- Add badge system to products table
-- This migration adds comprehensive badge management for products

ALTER TABLE products 
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN is_bestseller BOOLEAN DEFAULT false,
ADD COLUMN is_new_arrival BOOLEAN DEFAULT false,
ADD COLUMN is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN is_limited_edition BOOLEAN DEFAULT false,
ADD COLUMN is_sold_out BOOLEAN DEFAULT false,
ADD COLUMN custom_badge_text TEXT,
ADD COLUMN badge_color VARCHAR(7) DEFAULT '#ef4444',
ADD COLUMN badge_priority INTEGER DEFAULT 0,
ADD COLUMN badge_display_until TIMESTAMPTZ,
ADD COLUMN badge_display_from TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN products.is_featured IS 'Featured product badge - highlights special products';
COMMENT ON COLUMN products.is_bestseller IS 'Bestseller product badge - for top-selling items';
COMMENT ON COLUMN products.is_new_arrival IS 'New arrival product badge - for recently added products';
COMMENT ON COLUMN products.is_on_sale IS 'On sale product badge - for discounted items';
COMMENT ON COLUMN products.is_limited_edition IS 'Limited edition product badge - for exclusive items';
COMMENT ON COLUMN products.is_sold_out IS 'Sold out product badge - for out of stock items';
COMMENT ON COLUMN products.custom_badge_text IS 'Custom badge text for special promotions (e.g., "Flash Sale", "Limited Time")';
COMMENT ON COLUMN products.badge_color IS 'Hex color code for badge background (e.g., #ef4444 for red)';
COMMENT ON COLUMN products.badge_priority IS 'Display priority (1=highest, 0=default) - determines badge order when multiple badges exist';
COMMENT ON COLUMN products.badge_display_until IS 'Badge expires at this timestamp - useful for time-limited promotions';
COMMENT ON COLUMN products.badge_display_from IS 'Badge becomes active from this timestamp - useful for scheduled promotions';

-- Create index for efficient badge queries
CREATE INDEX idx_products_badges ON products (is_featured, is_bestseller, is_new_arrival, is_on_sale, is_limited_edition, is_sold_out) WHERE tenant_id IS NOT NULL;

-- Create index for badge scheduling queries
CREATE INDEX idx_products_badge_schedule ON products (badge_display_from, badge_display_until) WHERE tenant_id IS NOT NULL;

-- Add RLS policies for badge fields (inherit from existing product policies)
-- The existing RLS policies on products table will automatically apply to these new columns





























