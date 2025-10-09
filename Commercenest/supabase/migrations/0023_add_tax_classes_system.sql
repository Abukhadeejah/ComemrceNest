-- Add tax classes system for flexible tax configuration
-- This allows tenants to define multiple tax classes with different rates

-- Create tax_classes table
CREATE TABLE IF NOT EXISTS public.tax_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  rate_percent numeric(5,2) NOT NULL DEFAULT 0.00,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Add tax_class_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tax_class_id uuid REFERENCES public.tax_classes(id) ON DELETE SET NULL;

-- Enable RLS on tax_classes
ALTER TABLE public.tax_classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for tax_classes
CREATE POLICY "Tenant read tax classes"
  ON public.tax_classes FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant admin manage tax classes"
  ON public.tax_classes FOR ALL
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_classes_tenant_id ON public.tax_classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_classes_tenant_default ON public.tax_classes(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_products_tax_class_id ON public.products(tax_class_id) WHERE tax_class_id IS NOT NULL;

-- Insert default tax classes for existing tenants
-- For Bluebell (18% default)
INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
SELECT 
  id as tenant_id,
  'Standard GST' as name,
  'Standard GST rate for most products' as description,
  18.00 as rate_percent,
  true as is_default,
  true as is_active
FROM public.tenants 
WHERE name = 'Bluebell Interiors'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- For Senlysh (12% default)
INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
SELECT 
  id as tenant_id,
  'Standard GST' as name,
  'Standard GST rate for fashion products' as description,
  12.00 as rate_percent,
  true as is_default,
  true as is_active
FROM public.tenants 
WHERE name = 'Senlysh'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add common Indian GST tax classes for all tenants
-- Insert individual tax classes to avoid record type issues
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN SELECT id FROM public.tenants LOOP
        -- Insert GST 0%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 0%', 'Tax-free products', 0.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Insert GST 3%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 3%', 'Essential goods', 3.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Insert GST 5%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 5%', 'Basic necessities', 5.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Insert GST 12%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 12%', 'Standard rate for many goods', 12.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Insert GST 18%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 18%', 'Standard rate for services', 18.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Insert GST 28%
        INSERT INTO public.tax_classes (tenant_id, name, description, rate_percent, is_default, is_active)
        VALUES (tenant_record.id, 'GST 28%', 'Luxury goods and services', 28.00, false, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
    END LOOP;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tax_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_classes_updated_at
  BEFORE UPDATE ON public.tax_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tax_classes_updated_at();
