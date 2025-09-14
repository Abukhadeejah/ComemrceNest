-- Add size_guide_type column to products table
-- This allows products to specify which size guide category they belong to

ALTER TABLE products 
ADD COLUMN size_guide_type VARCHAR(50) DEFAULT 'none';

-- Add comment to explain the column
COMMENT ON COLUMN products.size_guide_type IS 'Size guide category for the product (e.g., clothing, shoes, perfume, none)';

-- Create an index for better query performance
CREATE INDEX idx_products_size_guide_type ON products(size_guide_type);

-- Update existing products to have appropriate size guide types based on their categories
-- This is a basic mapping - can be refined later
UPDATE products 
SET size_guide_type = CASE 
  WHEN EXISTS (
    SELECT 1 FROM product_categories pc 
    JOIN categories c ON pc.category_id = c.id 
    WHERE pc.product_id = products.id 
    AND c.name ILIKE '%dress%' OR c.name ILIKE '%shirt%' OR c.name ILIKE '%top%' OR c.name ILIKE '%bottom%'
  ) THEN 'clothing'
  WHEN EXISTS (
    SELECT 1 FROM product_categories pc 
    JOIN categories c ON pc.category_id = c.id 
    WHERE pc.product_id = products.id 
    AND c.name ILIKE '%shoe%' OR c.name ILIKE '%footwear%'
  ) THEN 'shoes'
  WHEN EXISTS (
    SELECT 1 FROM product_categories pc 
    JOIN categories c ON pc.category_id = c.id 
    WHERE pc.product_id = products.id 
    AND c.name ILIKE '%perfume%' OR c.name ILIKE '%fragrance%'
  ) THEN 'perfume'
  WHEN EXISTS (
    SELECT 1 FROM product_categories pc 
    JOIN categories c ON pc.category_id = c.id 
    WHERE pc.product_id = products.id 
    AND c.name ILIKE '%bag%' OR c.name ILIKE '%wallet%' OR c.name ILIKE '%accessory%'
  ) THEN 'accessories'
  ELSE 'none'
END;

