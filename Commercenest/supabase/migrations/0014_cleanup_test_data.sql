-- Migration: Clean up test data and order dependencies
-- Date: December 19, 2024
-- Description: Remove order dependencies for test products to enable deletion testing

-- First, delete order items that reference test products
DELETE FROM order_items
WHERE product_id IN (
    SELECT id FROM products
    WHERE LOWER(name) LIKE '%test%'
       OR LOWER(name) LIKE '%e2e%'
       OR LOWER(name) LIKE '%comprehensive%'
       OR LOWER(name) LIKE '%badge%'
       OR LOWER(name) LIKE '%sync%'
       OR LOWER(name) LIKE '%demo%'
);

-- Delete any orders that are now empty (no order items)
DELETE FROM orders
WHERE id NOT IN (
    SELECT DISTINCT order_id FROM order_items
);

-- Now delete the test products themselves
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





