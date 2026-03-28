-- ============================================================================
-- IDEMPOTENCY PROTECTION FOR PAYMENT WEBHOOKS
-- ============================================================================
-- Purpose: Prevent duplicate cashback credits, emails, and order updates
--          when payment gateways retry webhooks
-- Date: February 6, 2026
-- Critical: This prevents money loss from duplicate webhook processing
-- ============================================================================

-- Add idempotency flag to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS post_payment_processed boolean DEFAULT false;

-- Add index for fast lookups (critical for webhook performance)
CREATE INDEX IF NOT EXISTS idx_orders_post_payment_processed 
  ON orders (post_payment_processed);

-- Add index on order_number for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number 
  ON orders (order_number);

-- Add comment for documentation
COMMENT ON COLUMN orders.post_payment_processed IS 
  'Idempotency flag: true if post-payment processing (cashback, email, etc.) has been completed. Prevents duplicate processing on webhook retries.';

-- Verify the changes
DO $$
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'post_payment_processed'
  ) THEN
    RAISE NOTICE '✅ Column post_payment_processed added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add post_payment_processed column';
  END IF;

  -- Check if index exists
  IF EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'orders' 
    AND indexname = 'idx_orders_post_payment_processed'
  ) THEN
    RAISE NOTICE '✅ Index idx_orders_post_payment_processed created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create index';
  END IF;
END $$;

-- Show sample of orders table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('id', 'order_number', 'status', 'post_payment_processed')
ORDER BY ordinal_position;
