-- ============================================================================
-- ADD RETURN STATES TO ORDER STATUS ENUM
-- ============================================================================
-- Purpose:
-- 1) Allow orders.status to persist return-aware lifecycle values.
-- 2) Support offline return flow updates to partially_returned/returned.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status'
      AND e.enumlabel = 'partially_returned'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'partially_returned';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status'
      AND e.enumlabel = 'returned'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'returned';
  END IF;
END $$;