-- Payments support: webhook idempotency and indexes

-- Unique index to help lookup by provider order id
create unique index if not exists idx_orders_razorpay_order on public.orders(razorpay_order_id) where razorpay_order_id is not null;

-- Webhook events table for idempotency
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,
  event_id text not null,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.payment_webhook_events enable row level security;

-- Server-only access; optional superadmin read
create policy "Payment events server-only insert" on public.payment_webhook_events
  for insert with check (auth.role() = 'service_role');
create policy "Payment events server-only update" on public.payment_webhook_events
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Payment events server-only delete" on public.payment_webhook_events
  for delete using (auth.role() = 'service_role');
create policy "Payment events superadmin select" on public.payment_webhook_events
  for select using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'superadmin'));


