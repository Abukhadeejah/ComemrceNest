-- Dev convenience: map localhost to Bluebell tenant for local testing
-- Safe to run multiple times due to ON CONFLICT

insert into public.tenant_domains (tenant_id, hostname, is_primary, ssl_status)
values ('11111111-1111-4111-8111-11111111bb01'::uuid, 'localhost', false, 'pending')
on conflict (hostname) do nothing;


