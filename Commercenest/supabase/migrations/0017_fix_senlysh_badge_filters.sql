-- Fix Senlysh Badge Filters
-- Set badge flags on Senlysh products to demonstrate working filters

-- Set some Senlysh products as featured
UPDATE products
SET is_featured = true
WHERE id IN (
    SELECT id FROM products
    WHERE tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    ORDER BY created_at DESC
    LIMIT 2
) AND tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';

-- Set some Senlysh products as bestseller
UPDATE products
SET is_bestseller = true
WHERE id IN (
    SELECT id FROM products
    WHERE tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    ORDER BY created_at ASC
    LIMIT 2
) AND tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';

-- Set some as new arrivals
UPDATE products
SET is_new_arrival = true
WHERE id IN (
    SELECT id FROM products
    WHERE tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    ORDER BY created_at DESC
    LIMIT 1
) AND tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';

-- Set some as on sale
UPDATE products
SET is_on_sale = true
WHERE id IN (
    SELECT id FROM products
    WHERE tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    ORDER BY created_at ASC
    LIMIT 1
) AND tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';



