-- Hero slides and settings for tenant-managed homepage hero
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text,
  subtitle text,
  description text,
  cta_text text,
  cta_link text,
  badge text,
  sale_text text,
  urgency_text text,
  features jsonb,
  image_url text,
  countdown boolean DEFAULT false,
  countdown_end timestamptz,
  bg_overlay_class text,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hero_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auto_play boolean NOT NULL DEFAULT true,
  auto_play_interval_ms int NOT NULL DEFAULT 5000,
  bg_overlay_class text DEFAULT 'bg-black/20',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hero_slides_tenant_position ON public.hero_slides(tenant_id, position);
CREATE INDEX IF NOT EXISTS idx_hero_slides_tenant_active ON public.hero_slides(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_hero_settings_tenant ON public.hero_settings(tenant_id);

-- RLS Policies for tenant isolation
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

-- Hero slides policies
CREATE POLICY "hero_slides_select_policy" ON public.hero_slides
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_slides_insert_policy" ON public.hero_slides
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_slides_update_policy" ON public.hero_slides
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_slides_delete_policy" ON public.hero_slides
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Hero settings policies
CREATE POLICY "hero_settings_select_policy" ON public.hero_settings
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_settings_insert_policy" ON public.hero_settings
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_settings_update_policy" ON public.hero_settings
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "hero_settings_delete_policy" ON public.hero_settings
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_slides_updated_at 
  BEFORE UPDATE ON public.hero_slides 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hero_settings_updated_at 
  BEFORE UPDATE ON public.hero_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial hero settings for existing tenants
INSERT INTO public.hero_settings (tenant_id, auto_play, auto_play_interval_ms, bg_overlay_class)
SELECT 
  id as tenant_id,
  true as auto_play,
  5000 as auto_play_interval_ms,
  'bg-black/20' as bg_overlay_class
FROM public.tenants
WHERE id NOT IN (SELECT tenant_id FROM public.hero_settings);

-- Seed initial hero slides for Senlysh Fashion
INSERT INTO public.hero_slides (
  tenant_id, title, subtitle, description, cta_text, cta_link, badge, 
  sale_text, urgency_text, features, image_url, countdown, countdown_end, 
  bg_overlay_class, position, is_active
)
SELECT 
  t.id as tenant_id,
  'NEW' as title,
  'COLLECTION' as subtitle,
  'Discover the latest trends in fashion' as description,
  'Shop Now' as cta_text,
  '/new-arrivals' as cta_link,
  'TRENDING' as badge,
  NULL as sale_text,
  NULL as urgency_text,
  '["Free Shipping", "New Arrivals"]'::jsonb as features,
  'https://images.pexels.com/photos/1857353/pexels-photo-1857353.jpeg' as image_url,
  true as countdown,
  '2024-12-31T23:59:59'::timestamptz as countdown_end,
  'bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900' as bg_overlay_class,
  0 as position,
  true as is_active
FROM public.tenants t
WHERE t.name = 'Senlysh Fashion'
AND NOT EXISTS (
  SELECT 1 FROM public.hero_slides hs 
  WHERE hs.tenant_id = t.id
);

-- Add second slide for Senlysh
INSERT INTO public.hero_slides (
  tenant_id, title, subtitle, description, cta_text, cta_link, badge, 
  sale_text, urgency_text, features, image_url, countdown, countdown_end, 
  bg_overlay_class, position, is_active
)
SELECT 
  t.id as tenant_id,
  'WINTER' as title,
  'ESSENTIALS' as subtitle,
  'Stay warm and stylish this season' as description,
  'Shop Winter' as cta_text,
  '/products?category=winter' as cta_link,
  'SALE' as badge,
  'UP TO 50% OFF' as sale_text,
  'Limited Time' as urgency_text,
  '["Winter Collection", "Cozy Styles"]'::jsonb as features,
  'https://images.pexels.com/photos/5868259/pexels-photo-5868259.jpeg' as image_url,
  false as countdown,
  NULL as countdown_end,
  'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900' as bg_overlay_class,
  1 as position,
  true as is_active
FROM public.tenants t
WHERE t.name = 'Senlysh Fashion'
AND NOT EXISTS (
  SELECT 1 FROM public.hero_slides hs 
  WHERE hs.tenant_id = t.id AND hs.position = 1
);

-- Add third slide for Senlysh
INSERT INTO public.hero_slides (
  tenant_id, title, subtitle, description, cta_text, cta_link, badge, 
  sale_text, urgency_text, features, image_url, countdown, countdown_end, 
  bg_overlay_class, position, is_active
)
SELECT 
  t.id as tenant_id,
  'ACCESSORIES' as title,
  'COLLECTION' as subtitle,
  'Complete your look with our stylish accessories' as description,
  'Shop Accessories' as cta_text,
  '/products?category=accessories' as cta_link,
  'NEW' as badge,
  NULL as sale_text,
  NULL as urgency_text,
  '["Trending Accessories", "Perfect Match"]'::jsonb as features,
  'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg' as image_url,
  false as countdown,
  NULL as countdown_end,
  'bg-gradient-to-r from-pink-900 via-rose-900 to-pink-900' as bg_overlay_class,
  2 as position,
  true as is_active
FROM public.tenants t
WHERE t.name = 'Senlysh Fashion'
AND NOT EXISTS (
  SELECT 1 FROM public.hero_slides hs 
  WHERE hs.tenant_id = t.id AND hs.position = 2
);















