-- CommerceNest P0.2 — Feature Flags, Modules, Plugin Registry, Overrides

-- Registries
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.module_registry (
  module_key text primary key,
  version text not null,
  status text not null check (status in ('active','deprecated')),
  description text,
  metadata jsonb not null default '{}'
);

create table if not exists public.plugin_registry (
  plugin_key text primary key,
  interface_key text not null,
  version text not null,
  checksum text,
  status text not null check (status in ('active','deprecated')),
  metadata jsonb not null default '{}'
);

-- Tenant-scoped flags and modules
create table if not exists public.tenant_feature_flags (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  flag_id uuid not null references public.feature_flags(id) on delete cascade,
  variant text,
  enabled boolean not null default false,
  rollout jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, flag_id)
);

create table if not exists public.tenant_modules (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  module_key text not null references public.module_registry(module_key) on delete cascade,
  version text,
  enabled boolean not null default false,
  config jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, module_key)
);

create table if not exists public.tenant_flow_overrides (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  flow_key text not null,
  plugin_key text not null references public.plugin_registry(plugin_key),
  version text,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Integration secrets and outbox (optional)
create table if not exists public.tenant_integration_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  integration_key text not null,
  secret_enc bytea not null,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_key text not null,
  payload jsonb not null,
  status text not null check (status in ('pending','sent','failed')) default 'pending',
  attempts integer not null default 0,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.feature_flags enable row level security;
alter table public.module_registry enable row level security;
alter table public.plugin_registry enable row level security;
alter table public.tenant_feature_flags enable row level security;
alter table public.tenant_modules enable row level security;
alter table public.tenant_flow_overrides enable row level security;
alter table public.tenant_integration_secrets enable row level security;
alter table public.integration_outbox enable row level security;

-- Policies (superadmin on registries)
create policy "Flags superadmin" on public.feature_flags for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

create policy "Modules superadmin" on public.module_registry for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

create policy "Plugins superadmin" on public.plugin_registry for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));

-- Tenant-scoped tables
create policy "Tenant flags" on public.tenant_feature_flags for all
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy "Tenant modules" on public.tenant_modules for all
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy "Tenant overrides" on public.tenant_flow_overrides for all
  using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

-- Secrets/outbox server-only
create policy "Secrets server-only" on public.tenant_integration_secrets for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Outbox server-only" on public.integration_outbox for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


