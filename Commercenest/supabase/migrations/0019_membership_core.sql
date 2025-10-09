-- 0019_membership_core.sql
-- DB-first membership foundations (customers, addresses, wallet, coupons)
-- Safe for multi-tenant: every table includes tenant_id and RLS is enabled

-- Enums (optional light enums kept as text for flexibility)

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text,
  first_name text,
  last_name text,
  dob date,
  gender text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraints within tenant
create unique index if not exists customers_tenant_email_unique on public.customers(tenant_id, email);
create unique index if not exists customers_tenant_user_unique on public.customers(tenant_id, user_id) where user_id is not null;

alter table public.customers enable row level security;

-- Customers: self access (read/update)
drop policy if exists "customers_self_read" on public.customers;
create policy "customers_self_read" on public.customers
  for select using (user_id = auth.uid());

drop policy if exists "customers_self_update" on public.customers;
create policy "customers_self_update" on public.customers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Customers: tenant admin/editor manage
drop policy if exists "customers_admin_manage" on public.customers;
create policy "customers_admin_manage" on public.customers
  for all using (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = customers.tenant_id
        and tm.user_id = auth.uid()
        and tm.role in ('tenant_admin','tenant_editor')
    )
  ) with check (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = customers.tenant_id
        and tm.user_id = auth.uid()
        and tm.role in ('tenant_admin','tenant_editor')
    )
  );

-- Customers: server-only insert allowance (redundant for service role but explicit)
drop policy if exists "customers_server_insert" on public.customers;
create policy "customers_server_insert" on public.customers
  for insert with check (auth.role() = 'service_role');

-- Customer addresses
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'IN',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_addresses_default_unique on public.customer_addresses(customer_id) where is_default = true;

alter table public.customer_addresses enable row level security;

-- Addresses: self-owned access
drop policy if exists "addresses_self_access" on public.customer_addresses;
create policy "addresses_self_access" on public.customer_addresses
  for all using (
    exists (
      select 1 from public.customers c
      where c.id = customer_addresses.customer_id
        and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.customers c
      where c.id = customer_addresses.customer_id
        and c.user_id = auth.uid()
    )
  );

-- Addresses: tenant admin/editor manage
drop policy if exists "addresses_admin_manage" on public.customer_addresses;
create policy "addresses_admin_manage" on public.customer_addresses
  for all using (
    exists (
      select 1 from public.customers c
      join public.tenant_members tm on tm.tenant_id = c.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
      where c.id = customer_addresses.customer_id
    )
  ) with check (
    exists (
      select 1 from public.customers c
      join public.tenant_members tm on tm.tenant_id = c.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
      where c.id = customer_addresses.customer_id
    )
  );

-- Wallet accounts
create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_accounts_unique_per_customer on public.wallet_accounts(tenant_id, customer_id);

alter table public.wallet_accounts enable row level security;

-- Wallet accounts: self read
drop policy if exists "wallet_accounts_self_read" on public.wallet_accounts;
create policy "wallet_accounts_self_read" on public.wallet_accounts
  for select using (
    exists (
      select 1 from public.customers c where c.id = wallet_accounts.customer_id and c.user_id = auth.uid()
    )
  );

-- Wallet accounts: admin read, server/admin write
drop policy if exists "wallet_accounts_admin_read" on public.wallet_accounts;
create policy "wallet_accounts_admin_read" on public.wallet_accounts
  for select using (
    exists (
      select 1 from public.tenant_members tm
      join public.customers c on c.tenant_id = tm.tenant_id and c.id = wallet_accounts.customer_id
      where tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
    )
  );

drop policy if exists "wallet_accounts_server_write" on public.wallet_accounts;
create policy "wallet_accounts_server_write" on public.wallet_accounts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Wallet ledger (immutable entries: credits/debits)
create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_id uuid not null references public.wallet_accounts(id) on delete cascade,
  entry_type text not null check (entry_type in ('credit','debit')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'INR',
  source_key text not null, -- e.g., 'order_cashback', 'manual_adjustment'
  reference_id uuid,        -- e.g., order id
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wallet_ledger_account_idx on public.wallet_ledger(account_id, created_at desc);

alter table public.wallet_ledger enable row level security;

-- Ledger: self read; admin read; server-only writes
drop policy if exists "wallet_ledger_self_read" on public.wallet_ledger;
create policy "wallet_ledger_self_read" on public.wallet_ledger
  for select using (
    exists (
      select 1 from public.wallet_accounts wa
      join public.customers c on c.id = wa.customer_id
      where wa.id = wallet_ledger.account_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "wallet_ledger_admin_read" on public.wallet_ledger;
create policy "wallet_ledger_admin_read" on public.wallet_ledger
  for select using (
    exists (
      select 1 from public.wallet_accounts wa
      join public.customers c on c.id = wa.customer_id
      join public.tenant_members tm on tm.tenant_id = c.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
      where wa.id = wallet_ledger.account_id
    )
  );

drop policy if exists "wallet_ledger_server_write" on public.wallet_ledger;
create policy "wallet_ledger_server_write" on public.wallet_ledger
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  type text not null check (type in ('flat','percent')),
  value_cents integer,               -- when type='flat'
  value_percent numeric,             -- when type='percent', e.g., 10 for 10%
  max_discount_cents integer,
  min_order_cents integer,
  valid_from timestamptz,
  valid_until timestamptz,
  applies_to jsonb not null default '{}'::jsonb, -- shape: { scope: 'all'|'category'|'product', ids: [] }
  per_user_limit integer,
  total_redemptions_limit integer,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create unique index if not exists coupons_tenant_code_unique on public.coupons(tenant_id, code);

alter table public.coupons enable row level security;

-- Coupons: admin manage; server read/write; public direct read is avoided to prevent cross-tenant leakage
drop policy if exists "coupons_admin_manage" on public.coupons;
create policy "coupons_admin_manage" on public.coupons
  for all using (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = coupons.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
    )
  ) with check (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = coupons.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
    )
  );

drop policy if exists "coupons_server_access" on public.coupons;
create policy "coupons_server_access" on public.coupons
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Coupon redemptions
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_cents integer not null,
  redeemed_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_by_coupon on public.coupon_redemptions(coupon_id);
create index if not exists coupon_redemptions_by_customer on public.coupon_redemptions(customer_id, redeemed_at desc);

alter table public.coupon_redemptions enable row level security;

-- Redemptions: self read; admin read; server-only insert
drop policy if exists "coupon_redemptions_self_read" on public.coupon_redemptions;
create policy "coupon_redemptions_self_read" on public.coupon_redemptions
  for select using (
    exists (
      select 1 from public.customers c where c.id = coupon_redemptions.customer_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "coupon_redemptions_admin_read" on public.coupon_redemptions;
create policy "coupon_redemptions_admin_read" on public.coupon_redemptions
  for select using (
    exists (
      select 1 from public.customers c
      join public.tenant_members tm on tm.tenant_id = c.tenant_id and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
      where c.id = coupon_redemptions.customer_id
    )
  );

drop policy if exists "coupon_redemptions_server_insert" on public.coupon_redemptions;
create policy "coupon_redemptions_server_insert" on public.coupon_redemptions
  for insert with check (auth.role() = 'service_role');

-- Notes:
-- 1) Site/client never provides tenant_id directly. Server resolves and sets it.
-- 2) All writes to wallet_ledger are via trusted server to enforce idempotency and invariants.
-- 3) Coupons are evaluated server-side to avoid cross-tenant exposure and rule leaks.


