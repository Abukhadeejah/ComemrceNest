-- Create product_drafts table
create table if not exists public.product_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure one draft per product per tenant
create unique index if not exists product_drafts_tenant_product_uidx
  on public.product_drafts(tenant_id, product_id);

-- Update trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_drafts_set_updated_at on public.product_drafts;
create trigger trg_product_drafts_set_updated_at
before update on public.product_drafts
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.product_drafts enable row level security;

-- RLS: tenant admins can manage drafts for their tenant
create policy if not exists product_drafts_select on public.product_drafts
  for select
  using (tenant_id = auth.jwt() ->> 'tenant_id') with check (true);

create policy if not exists product_drafts_upsert on public.product_drafts
  for insert
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy if not exists product_drafts_update on public.product_drafts
  for update
  using (tenant_id = auth.jwt() ->> 'tenant_id')
  with check (tenant_id = auth.jwt() ->> 'tenant_id');

create policy if not exists product_drafts_delete on public.product_drafts
  for delete
  using (tenant_id = auth.jwt() ->> 'tenant_id');


