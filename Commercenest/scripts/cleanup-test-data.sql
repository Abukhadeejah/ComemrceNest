-- Cleanup Test Data Script
-- Date: December 19, 2024
-- Description: Remove all test products and related data from database

-- Delete test products (case-insensitive search for common test patterns)
DELETE FROM product_images
WHERE product_id IN (
    SELECT id FROM products
    WHERE LOWER(name) LIKE '%test%'
       OR LOWER(name) LIKE '%e2e%'
       OR LOWER(name) LIKE '%comprehensive%'
       OR LOWER(name) LIKE '%badge%'
       OR LOWER(name) LIKE '%sync%'
       OR LOWER(name) LIKE '%demo%'
       OR LOWER(slug) LIKE '%test%'
       OR LOWER(slug) LIKE '%e2e%'
       OR LOWER(description) LIKE '%test%'
       OR LOWER(description) LIKE '%comprehensive%'
       OR LOWER(description) LIKE '%e2e%'
);

-- Delete test products themselves
DELETE FROM products
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%e2e%'
   OR LOWER(name) LIKE '%comprehensive%'
   OR LOWER(name) LIKE '%badge%'
   OR LOWER(name) LIKE '%sync%'
   OR LOWER(name) LIKE '%demo%'
   OR LOWER(slug) LIKE '%test%'
   OR LOWER(slug) LIKE '%e2e%'
   OR LOWER(description) LIKE '%test%'
   OR LOWER(description) LIKE '%comprehensive%'
   OR LOWER(description) LIKE '%e2e%';

-- Delete orphaned product categories (products that no longer exist)
DELETE FROM product_categories
WHERE product_id NOT IN (SELECT id FROM products);

-- Delete orphaned product images (products that no longer exist)
DELETE FROM product_images
WHERE product_id NOT IN (SELECT id FROM products);

-- Delete orphaned variant combinations (products that no longer exist)
DELETE FROM variant_combinations
WHERE product_id NOT IN (SELECT id FROM products);

-- Delete orphaned product variants (products that no longer exist)
DELETE FROM product_variants
WHERE product_id NOT IN (SELECT id FROM products);

-- Delete orphaned product variant options (products that no longer exist)
DELETE FROM product_variant_options
WHERE product_id NOT IN (SELECT id FROM products);

-- Delete test categories
DELETE FROM categories
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%e2e%'
   OR LOWER(name) LIKE '%demo%'
   OR LOWER(slug) LIKE '%test%'
   OR LOWER(slug) LIKE '%e2e%';

-- Delete test hero slides
DELETE FROM hero_slides
WHERE LOWER(title) LIKE '%test%'
   OR LOWER(title) LIKE '%e2e%'
   OR LOWER(title) LIKE '%demo%'
   OR LOWER(description) LIKE '%test%'
   OR LOWER(description) LIKE '%e2e%'
   OR LOWER(description) LIKE '%comprehensive%';

-- Delete test tags (be careful not to delete legitimate tags)
-- Only delete tags that are exclusively used by test products
DELETE FROM tags
WHERE id NOT IN (
    SELECT DISTINCT tag_id
    FROM product_tags pt
    JOIN products p ON pt.product_id = p.id
    WHERE LOWER(p.name) NOT LIKE '%test%'
      AND LOWER(p.name) NOT LIKE '%e2e%'
      AND LOWER(p.name) NOT LIKE '%comprehensive%'
      AND LOWER(p.name) NOT LIKE '%badge%'
      AND LOWER(p.name) NOT LIKE '%sync%'
      AND LOWER(p.name) NOT LIKE '%demo%'
);

-- Delete orphaned product tags
DELETE FROM product_tags
WHERE product_id NOT IN (SELECT id FROM products)
   OR tag_id NOT IN (SELECT id FROM tags);

-- Clean up orders related to test products (be very careful here)
-- This is commented out by default as it might affect real orders
/*
DELETE FROM order_items
WHERE product_id NOT IN (SELECT id FROM products);

DELETE FROM orders
WHERE id NOT IN (
    SELECT DISTINCT order_id FROM order_items
);
*/

-- Log the cleanup operation
DO $$
BEGIN
    RAISE NOTICE 'Test data cleanup completed successfully';
    RAISE NOTICE 'Removed test products, categories, hero slides, and related data';
    RAISE NOTICE 'Database is now clean of test artifacts';
END $$;


