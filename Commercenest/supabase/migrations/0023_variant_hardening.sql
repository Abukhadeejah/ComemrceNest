-- Variant/product robustness hardening
-- Ensures DB rules match server/client validations

-- 1) products.has_variants should be NOT NULL DEFAULT false
ALTER TABLE public.products
  ALTER COLUMN has_variants SET DEFAULT false;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products'
      AND column_name='has_variants' AND is_nullable='YES'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN has_variants SET NOT NULL;
  END IF;
END $$;

-- 2) products.low_stock_threshold must be nonnegative
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_low_stock_threshold_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_low_stock_threshold_check CHECK (low_stock_threshold >= 0);
  END IF;
END $$;

-- 3) product_variants.stock must be nonnegative
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_check'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_stock_check CHECK (stock >= 0);
  END IF;
END $$;

-- 4) variant_option_values adjustments must be nonnegative
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vov_price_adj_check'
  ) THEN
    ALTER TABLE public.variant_option_values
      ADD CONSTRAINT vov_price_adj_check CHECK (price_adjustment_cents >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vov_cost_adj_check'
  ) THEN
    ALTER TABLE public.variant_option_values
      ADD CONSTRAINT vov_cost_adj_check CHECK (cost_adjustment_cents >= 0);
  END IF;
END $$;


