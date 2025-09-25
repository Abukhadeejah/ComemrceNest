-- Database setup for Gadget Bazaar (gadget-bazaar)
-- Run these commands in your Supabase SQL editor

-- 1. Create tenant record
INSERT INTO tenants (name, status, created_at, updated_at)
VALUES ('Gadget Bazaar', 'active', NOW(), NOW());

-- 2. Get the tenant ID (replace with actual ID from above)
-- SET tenant_id = 'your-tenant-id-here';

-- 3. Add tenant domain (for localhost development)
INSERT INTO tenant_domains (tenant_id, hostname, is_primary, created_at)
VALUES (
  (SELECT id FROM tenants WHERE name = 'Gadget Bazaar'),
  'localhost',
  true,
  NOW()
);

-- 4. Create sample products for gadget-bazaar
INSERT INTO products (
  tenant_id,
  name,
  slug,
  description,
  price_cents,
  compare_at_price_cents,
  currency,
  hero_image_url,
  stock,
  status,
  created_at,
  updated_at
) VALUES
-- Add your electronics products here
(
  (SELECT id FROM tenants WHERE name = 'Gadget Bazaar'),
  'Premium electronics Product',
  'premium-gadget-bazaar-product',
  'High-quality electronics product from Gadget Bazaar',
  99900, -- ₹999.00
  129900, -- ₹1,299.00 (compare at)
  'INR',
  '/images/gadget-bazaar-product.jpg',
  50,
  'published',
  NOW(),
  NOW()
);

-- 5. Create tenant-specific settings
INSERT INTO settings_company_profile (
  tenant_id,
  name,
  brand_accent_hex,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM tenants WHERE name = 'Gadget Bazaar'),
  'Gadget Bazaar',
  '#2563eb', -- Blue brand color
  NOW(),
  NOW()
);

COMMIT;