-- ============================================================================
-- RECONCILE ORDER STATUSES FROM PROCESSED RETURNS
-- ============================================================================
-- Purpose:
-- 1) Backfill stale orders stuck in paid/fulfilled even after processed returns.
-- 2) Set status to partially_returned or returned based on cumulative returned qty.
-- ============================================================================

WITH returned_per_item AS (
  SELECT
    oi.tenant_id,
    oi.order_id,
    oi.id AS order_item_id,
    COALESCE(oi.quantity, 0) AS sold_qty,
    COALESCE(SUM(ori.returned_quantity), 0) AS returned_qty
  FROM order_items oi
  LEFT JOIN order_return_items ori
    ON ori.tenant_id = oi.tenant_id
   AND ori.order_item_id = oi.id
  LEFT JOIN order_returns r
    ON r.tenant_id = ori.tenant_id
   AND r.id = ori.order_return_id
   AND r.status = 'processed'
  GROUP BY oi.tenant_id, oi.order_id, oi.id, oi.quantity
),
order_return_totals AS (
  SELECT
    tenant_id,
    order_id,
    SUM(sold_qty) AS total_sold_qty,
    SUM(LEAST(sold_qty, returned_qty)) AS total_returned_qty
  FROM returned_per_item
  GROUP BY tenant_id, order_id
)
UPDATE orders o
SET status = CASE
  WHEN ort.total_returned_qty >= ort.total_sold_qty THEN 'returned'::order_status
  WHEN ort.total_returned_qty > 0 THEN 'partially_returned'::order_status
  ELSE o.status
END
FROM order_return_totals ort
WHERE o.tenant_id = ort.tenant_id
  AND o.id = ort.order_id
  AND ort.total_returned_qty > 0;