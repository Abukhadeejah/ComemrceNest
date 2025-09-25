-- Migration: Optimize admin dashboard performance
-- Date: December 19, 2024
-- Description: Create optimized function for tenant dashboard statistics

-- Create optimized function for tenant dashboard stats
CREATE OR REPLACE FUNCTION get_tenant_dashboard_stats(tenant_id_param UUID)
RETURNS TABLE (
  total_products BIGINT,
  published_products BIGINT,
  pending_orders BIGINT,
  total_revenue BIGINT,
  low_stock_products BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH product_stats AS (
    SELECT
      COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE status = 'published') as published_products,
      COUNT(*) FILTER (WHERE status = 'published') as low_stock_products
    FROM products
    WHERE tenant_id = tenant_id_param
  ),
  order_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
      COALESCE(SUM(total_cents), 0) as total_revenue
    FROM orders
    WHERE tenant_id = tenant_id_param
  )
  SELECT
    ps.total_products,
    ps.published_products,
    os.pending_orders,
    os.total_revenue,
    ps.low_stock_products
  FROM product_stats ps
  CROSS JOIN order_stats os;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tenant_dashboard_stats(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_tenant_dashboard_stats(UUID) IS 'Optimized function to get tenant dashboard statistics in a single query';

-- Create indexes to improve performance
-- Note: Using regular CREATE INDEX instead of CONCURRENTLY due to transaction limitations
CREATE INDEX IF NOT EXISTS idx_products_tenant_status
ON products(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status
ON orders(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_total_cents
ON orders(tenant_id, total_cents) WHERE total_cents IS NOT NULL;
