-- =====================================================
-- FIX COUPONS TABLE SCHEMA
-- =====================================================
-- This migration adds missing columns to the coupons table
-- Run this if you get errors about missing columns
-- =====================================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add discount_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'discount_type') THEN
    ALTER TABLE coupons ADD COLUMN discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' 
      CHECK (discount_type IN ('percentage', 'fixed'));
    RAISE NOTICE 'Added discount_type column';
  END IF;
  
  -- Add discount_value column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'discount_value') THEN
    ALTER TABLE coupons ADD COLUMN discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0 
      CHECK (discount_value > 0);
    RAISE NOTICE 'Added discount_value column';
  END IF;
  
  -- Add max_discount_cents column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_discount_cents') THEN
    ALTER TABLE coupons ADD COLUMN max_discount_cents INTEGER;
    RAISE NOTICE 'Added max_discount_cents column';
  END IF;
  
  -- Add valid_from column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_from') THEN
    ALTER TABLE coupons ADD COLUMN valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added valid_from column';
  END IF;
  
  -- Add valid_until column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_until') THEN
    ALTER TABLE coupons ADD COLUMN valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year');
    RAISE NOTICE 'Added valid_until column';
  END IF;
  
  -- Add min_order_value_cents column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'min_order_value_cents') THEN
    ALTER TABLE coupons ADD COLUMN min_order_value_cents INTEGER DEFAULT 0;
    RAISE NOTICE 'Added min_order_value_cents column';
  END IF;
  
  -- Add max_uses column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_uses') THEN
    ALTER TABLE coupons ADD COLUMN max_uses INTEGER;
    RAISE NOTICE 'Added max_uses column';
  END IF;
  
  -- Add uses_per_customer column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'uses_per_customer') THEN
    ALTER TABLE coupons ADD COLUMN uses_per_customer INTEGER DEFAULT 1;
    RAISE NOTICE 'Added uses_per_customer column';
  END IF;
  
  -- Add is_active column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'is_active') THEN
    ALTER TABLE coupons ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column';
  END IF;
  
  -- Add description column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'description') THEN
    ALTER TABLE coupons ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  END IF;
  
  -- Add created_by column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'created_by') THEN
    ALTER TABLE coupons ADD COLUMN created_by UUID REFERENCES users(id);
    RAISE NOTICE 'Added created_by column';
  END IF;
  
  -- Add updated_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'updated_at') THEN
    ALTER TABLE coupons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
  
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add valid_date_range check constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_date_range') THEN
    ALTER TABLE coupons ADD CONSTRAINT valid_date_range CHECK (valid_until > valid_from);
    RAISE NOTICE 'Added valid_date_range constraint';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint valid_date_range already exists';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(tenant_id, is_active);

-- Enable RLS if not enabled
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE coupons IS 'Discount coupons that can be applied to orders - schema fixed';
