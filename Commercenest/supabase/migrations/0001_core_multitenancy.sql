-- CommerceNest P0.2 — Core Multitenancy, Modules (baseline), Commerce, RLS
-- NOTE: Review in Supabase SQL editor before applying. Adjust if your project already has schema.

-- Extensions (safe if already installed)
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.tenant_status as enum ('active','suspended','maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tenant_member_role as enum ('tenant_admin','tenant_editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending','paid','failed','fulfilled','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('draft','published');
exception when duplicate_object then null; end $$;

-- Platform profiles (for superadmin/staff)
do $$ begin
  create type public.platform_role as enum ('superadmin','staff');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Tenancy core
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.domain_ssl_status as enum ('pending','active','error');
exception when duplicate_object then null; end $$;

create table if not exists public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname text not null unique,
  is_primary boolean not null default false,
  ssl_status public.domain_ssl_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role public.tenant_member_role not null default 'tenant_admin',
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- Business settings (branding, contacts)
create table if not exists public.settings_company_profile (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  logo_url text,
  address text,
  phone text,
  email text,
  gstin text,
  social jsonb not null default '{}',
  brand_accent_hex text default '#C9A227',
  brand_neutrals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Commerce: categories/products and media
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (id, tenant_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'INR',
  status public.product_status not null default 'draft',
  hero_image_url text,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (id, tenant_id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  constraint fk_product_images_product
    foreign key (product_id, tenant_id) references public.products(id, tenant_id) on delete cascade
);

create table if not exists public.product_categories (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null,
  category_id uuid not null,
  primary key (product_id, category_id),
  constraint fk_product_categories_product
    foreign key (product_id, tenant_id) references public.products(id, tenant_id) on delete cascade,
  constraint fk_product_categories_category
    foreign key (category_id, tenant_id) references public.categories(id, tenant_id) on delete cascade
);

-- Portfolio
do $$ begin
  create type public.project_status as enum ('draft','published');
exception when duplicate_object then null; end $$;

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  location text,
  featured boolean not null default false,
  status public.project_status not null default 'draft',
  hero_image_url text,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (id, tenant_id)
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  constraint fk_portfolio_images_project
    foreign key (project_id, tenant_id) references public.portfolio_projects(id, tenant_id) on delete cascade
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_number text not null,
  email text not null,
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'INR',
  status public.order_status not null default 'pending',
  payment_provider text not null default 'razorpay',
  razorpay_order_id text,
  created_at timestamptz not null default now(),
  unique (tenant_id, order_number),
  unique (id, tenant_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null,
  product_id uuid not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  constraint fk_order_items_order
    foreign key (order_id, tenant_id) references public.orders(id, tenant_id) on delete cascade,
  constraint fk_order_items_product
    foreign key (product_id, tenant_id) references public.products(id, tenant_id)
);

-- CMS pages
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  title text not null,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

-- Payments: per-tenant Razorpay
do $$ begin
  create type public.capture_mode as enum ('auto','manual');
exception when duplicate_object then null; end $$;

create table if not exists public.tenant_payment_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  env text not null check (env in ('test','live')),
  enabled boolean not null default false,
  razorpay_key_id text,
  razorpay_key_secret bytea,
  webhook_secret bytea,
  capture_mode public.capture_mode not null default 'auto',
  test_mode boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, env)
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  role text,
  tenant_id uuid,
  action text not null,
  resource text,
  before_json jsonb,
  after_json jsonb,
  ip text,
  ua text,
  created_at timestamptz not null default now()
);

-- RLS helpers
create or replace function public.is_tenant_member(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_editor(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
  );
$$;

create or replace function public.is_tenant_admin(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid() and tm.role = 'tenant_admin'
  );
$$;

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.tenant_members enable row level security;
alter table public.settings_company_profile enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cms_pages enable row level security;
alter table public.tenant_payment_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Policies
-- Tenants: superadmin only
create policy "Tenants superadmin select" on public.tenants
  for select using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Tenants superadmin insert" on public.tenants
  for insert with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Tenants superadmin update" on public.tenants
  for update using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Tenants superadmin delete" on public.tenants
  for delete using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

-- Domains: superadmin, and tenant admins can read their own
create policy "Domains read by tenant" on public.tenant_domains
  for select using (public.is_tenant_member(tenant_id));
create policy "Domains superadmin insert" on public.tenant_domains
  for insert with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Domains superadmin update" on public.tenant_domains
  for update using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Domains superadmin delete" on public.tenant_domains
  for delete using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

-- Tenant members: tenant admins manage, members read
create policy "Members read" on public.tenant_members
  for select using (public.is_tenant_member(tenant_id));
create policy "Members insert by admin" on public.tenant_members
  for insert with check (public.is_tenant_admin(tenant_id));
create policy "Members update by admin" on public.tenant_members
  for update using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));
create policy "Members delete by admin" on public.tenant_members
  for delete using (public.is_tenant_admin(tenant_id));

-- Settings
create policy "Settings read by tenant" on public.settings_company_profile
  for select using (public.is_tenant_member(tenant_id));
create policy "Settings insert by tenant" on public.settings_company_profile
  for insert with check (public.is_tenant_admin(tenant_id));
create policy "Settings update by tenant" on public.settings_company_profile
  for update using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));
create policy "Settings delete by tenant" on public.settings_company_profile
  for delete using (public.is_tenant_admin(tenant_id));

-- Categories/products (public read published via server; prefer server-only fetch)
create policy "Categories read by tenant" on public.categories
  for select using (public.is_tenant_member(tenant_id));
create policy "Categories insert by tenant" on public.categories
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Categories update by tenant" on public.categories
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Categories delete by tenant" on public.categories
  for delete using (public.is_tenant_editor(tenant_id));

create policy "Products read by tenant" on public.products
  for select using (public.is_tenant_member(tenant_id));
create policy "Products insert by tenant" on public.products
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Products update by tenant" on public.products
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Products delete by tenant" on public.products
  for delete using (public.is_tenant_editor(tenant_id));

create policy "Product images read by tenant" on public.product_images
  for select using (public.is_tenant_member(tenant_id));
create policy "Product images insert by tenant" on public.product_images
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Product images update by tenant" on public.product_images
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Product images delete by tenant" on public.product_images
  for delete using (public.is_tenant_editor(tenant_id));

create policy "Product categories read" on public.product_categories
  for select using (public.is_tenant_member(tenant_id));
create policy "Product categories insert" on public.product_categories
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Product categories update" on public.product_categories
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Product categories delete" on public.product_categories
  for delete using (public.is_tenant_editor(tenant_id));

-- Portfolio
create policy "Portfolio read by tenant" on public.portfolio_projects
  for select using (public.is_tenant_member(tenant_id));
create policy "Portfolio insert by tenant" on public.portfolio_projects
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Portfolio update by tenant" on public.portfolio_projects
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Portfolio delete by tenant" on public.portfolio_projects
  for delete using (public.is_tenant_editor(tenant_id));

create policy "Portfolio images read by tenant" on public.portfolio_images
  for select using (public.is_tenant_member(tenant_id));
create policy "Portfolio images insert" on public.portfolio_images
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "Portfolio images update" on public.portfolio_images
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "Portfolio images delete" on public.portfolio_images
  for delete using (public.is_tenant_editor(tenant_id));

-- Orders: server-only writes; tenant admins read their own
create policy "Orders server-only insert" on public.orders
  for insert with check (auth.role() = 'service_role');
create policy "Orders server-only update" on public.orders
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Orders server-only delete" on public.orders
  for delete using (auth.role() = 'service_role');
create policy "Orders read by tenant" on public.orders
  for select using (public.is_tenant_member(tenant_id));

create policy "Order items server-only insert" on public.order_items
  for insert with check (auth.role() = 'service_role');
create policy "Order items server-only update" on public.order_items
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Order items server-only delete" on public.order_items
  for delete using (auth.role() = 'service_role');

-- CMS
create policy "CMS read by tenant" on public.cms_pages
  for select using (public.is_tenant_member(tenant_id));
create policy "CMS insert by tenant" on public.cms_pages
  for insert with check (public.is_tenant_editor(tenant_id));
create policy "CMS update by tenant" on public.cms_pages
  for update using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));
create policy "CMS delete by tenant" on public.cms_pages
  for delete using (public.is_tenant_editor(tenant_id));

-- Payment settings: server-only
create policy "Payment settings server-only select" on public.tenant_payment_settings
  for select using (auth.role() = 'service_role');
create policy "Payment settings server-only insert" on public.tenant_payment_settings
  for insert with check (auth.role() = 'service_role');
create policy "Payment settings server-only update" on public.tenant_payment_settings
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Payment settings server-only delete" on public.tenant_payment_settings
  for delete using (auth.role() = 'service_role');

-- Audit logs: superadmin read; server-only write
create policy "Audit read superadmin" on public.audit_logs
  for select using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));
create policy "Audit server-only write" on public.audit_logs
  for insert with check (auth.role() = 'service_role');

-- Indexes for performance
create index if not exists idx_products_tenant_status_updated on public.products(tenant_id, status, updated_at desc);
create index if not exists idx_projects_tenant_status on public.portfolio_projects(tenant_id, status);
create index if not exists idx_orders_tenant_created on public.orders(tenant_id, created_at desc);
create index if not exists idx_cms_tenant_key on public.cms_pages(tenant_id, key);


