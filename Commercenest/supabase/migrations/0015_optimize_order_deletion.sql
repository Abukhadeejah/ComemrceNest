-- Migration: Optimize order deletion performance
-- Date: December 19, 2024
-- Description: Create optimized function for order deletion with proper transaction handling

-- Create optimized function for order deletion
CREATE OR REPLACE FUNCTION delete_order_safely(order_id_param UUID, tenant_id_param UUID)
RETURNS TABLE (
  deleted_order_id UUID,
  deleted_items_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  items_count INTEGER := 0;
BEGIN
  -- Check if order exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM orders
    WHERE id = order_id_param AND tenant_id = tenant_id_param
  ) THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Get count of order items before deletion
  SELECT COUNT(*) INTO items_count
  FROM order_items
  WHERE order_id = order_id_param AND tenant_id = tenant_id_param;

  -- Delete order (this will cascade delete order_items due to FK constraint)
  DELETE FROM orders
  WHERE id = order_id_param AND tenant_id = tenant_id_param;

  -- Return the deleted order ID and items count
  RETURN QUERY SELECT order_id_param, items_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE EXCEPTION 'Failed to delete order %: %', order_id_param, SQLERRM;
END;
$$;

-- Add indexes to improve order deletion performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_tenant
ON order_items(order_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status
ON orders(tenant_id, status);

-- Add a partial index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id_status
ON orders(tenant_id, id, status)
WHERE status IN ('pending', 'paid', 'fulfilled');


