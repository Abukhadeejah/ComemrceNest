-- Migration: Fix product deletion foreign key constraint issue
-- Date: December 19, 2024
-- Description: Create optimized function for product deletion that handles all related records

-- Create optimized function for product deletion with proper cascading
CREATE OR REPLACE FUNCTION delete_product_safely(product_id_param UUID, tenant_id_param UUID)
RETURNS TABLE (
  deleted_product_id UUID,
  deleted_order_items INTEGER,
  deleted_images INTEGER,
  deleted_categories INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_items_count INTEGER := 0;
  images_count INTEGER := 0;
  categories_count INTEGER := 0;
BEGIN
  -- Check if product exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id_param AND tenant_id = tenant_id_param
  ) THEN
    RAISE EXCEPTION 'Product not found or access denied';
  END IF;

  -- Count order items before deletion
  SELECT COUNT(*) INTO order_items_count
  FROM order_items
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Count images before deletion
  SELECT COUNT(*) INTO images_count
  FROM product_images
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Count categories before deletion
  SELECT COUNT(*) INTO categories_count
  FROM product_categories
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Delete order items (must be done first due to FK constraints)
  DELETE FROM order_items
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Delete product images
  DELETE FROM product_images
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Delete product categories
  DELETE FROM product_categories
  WHERE product_id = product_id_param AND tenant_id = tenant_id_param;

  -- Finally delete the product
  DELETE FROM products
  WHERE id = product_id_param AND tenant_id = tenant_id_param;

  -- Return the deletion statistics
  RETURN QUERY SELECT product_id_param, order_items_count, images_count, categories_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE EXCEPTION 'Failed to delete product %: %', product_id_param, SQLERRM;
END;
$$;

-- Add additional indexes to improve product deletion performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_tenant
ON order_items(product_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_tenant
ON product_images(product_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_product_tenant
ON product_categories(product_id, tenant_id);











