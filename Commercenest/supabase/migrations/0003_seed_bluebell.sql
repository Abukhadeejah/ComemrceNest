-- CommerceNest P0.2 — Seed Bluebell tenant, modules, flags, and baseline settings
-- NOTE: Adjust hostname if needed before running. This script is idempotent.

-- Constants (inline literals; edit these two values manually if desired)
-- Bluebell tenant: 11111111-1111-4111-8111-11111111bb01
-- Hostname: bluebell.localhost

-- Tenant
insert into public.tenants (id, name, status)
values ('11111111-1111-4111-8111-11111111bb01'::uuid, 'Bluebell Interiors', 'active')
on conflict (id) do nothing;

-- Domain
insert into public.tenant_domains (tenant_id, hostname, is_primary, ssl_status)
values ('11111111-1111-4111-8111-11111111bb01'::uuid, 'bluebell.localhost', true, 'pending')
on conflict (hostname) do nothing;

-- Module registry seeds (core modules)
insert into public.module_registry (module_key, version, status, description)
values
  ('products', 'v1', 'active', 'Products module'),
  ('orders', 'v1', 'active', 'Orders module'),
  ('portfolio', 'v1', 'active', 'Portfolio module'),
  ('cms', 'v1', 'active', 'CMS module'),
  ('payments', 'v1', 'active', 'Payments module')
on conflict (module_key) do update set version = excluded.version, status = excluded.status;

-- Feature flags seeds (foundational)
insert into public.feature_flags (key, description)
values
  ('analytics_collection', 'Enable analytics event capture'),
  ('analytics_export', 'Allow analytics export/warehouse sync'),
  ('ai_insights', 'Enable AI insights surfaces (internal)')
on conflict (key) do nothing;

-- Enable baseline modules for Bluebell (v1)
insert into public.tenant_modules (tenant_id, module_key, version, enabled, config)
values
  ('11111111-1111-4111-8111-11111111bb01'::uuid, 'products', 'v1', true, '{}'::jsonb),
  ('11111111-1111-4111-8111-11111111bb01'::uuid, 'orders', 'v1', true, '{}'::jsonb),
  ('11111111-1111-4111-8111-11111111bb01'::uuid, 'portfolio', 'v1', true, '{}'::jsonb),
  ('11111111-1111-4111-8111-11111111bb01'::uuid, 'cms', 'v1', true, '{}'::jsonb),
  ('11111111-1111-4111-8111-11111111bb01'::uuid, 'payments', 'v1', true, '{}'::jsonb)
on conflict (tenant_id, module_key) do update set enabled = excluded.enabled, version = excluded.version;

-- Initialize tenant feature flags for Bluebell (default: disabled)
insert into public.tenant_feature_flags (tenant_id, flag_id, variant, enabled)
select '11111111-1111-4111-8111-11111111bb01'::uuid, ff.id, null, false
from public.feature_flags ff
where ff.key in ('analytics_collection','analytics_export','ai_insights')
on conflict (tenant_id, flag_id) do update set enabled = excluded.enabled;

-- Baseline company profile
insert into public.settings_company_profile (
  id, tenant_id, name, logo_url, address, phone, email, gstin, social, brand_accent_hex, brand_neutrals
)
values (
  gen_random_uuid(), '11111111-1111-4111-8111-11111111bb01'::uuid, 'Bluebell Interiors', null, null, null, null, null,
  '{}'::jsonb, '#C9A227', '[]'::jsonb
)
on conflict do nothing;

-- Optional: seed a tenant admin member
-- Replace the placeholder with a real auth.users.id when available, then uncomment
-- insert into public.tenant_members (user_id, tenant_id, role)
-- values ('<AUTH_USER_ID>'::uuid, '11111111-1111-4111-8111-11111111bb01'::uuid, 'tenant_admin')
-- on conflict (user_id, tenant_id) do nothing;


