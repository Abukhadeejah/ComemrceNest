-- Fix hero_image_url for products that have images in product_images table
-- but don't have hero_image_url set

UPDATE products 
SET hero_image_url = (
  SELECT pi.url 
  FROM product_images pi 
  WHERE pi.product_id = products.id 
  AND pi.url IS NOT NULL 
  AND pi.url != '[]'
  ORDER BY pi.sort_order ASC, pi.id ASC 
  LIMIT 1
)
WHERE hero_image_url IS NULL 
AND EXISTS (
  SELECT 1 
  FROM product_images pi 
  WHERE pi.product_id = products.id 
  AND pi.url IS NOT NULL 
  AND pi.url != '[]'
);
