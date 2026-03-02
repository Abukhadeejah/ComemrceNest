-- Persistent customer carts for cross-device sync
create table if not exists public.customer_carts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, customer_id)
);

create index if not exists idx_customer_carts_tenant_customer
  on public.customer_carts(tenant_id, customer_id);
