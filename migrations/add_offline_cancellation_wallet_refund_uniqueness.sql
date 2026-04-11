-- Ensure offline cancellation wallet refund can be credited at most once per order.
-- This is the hard idempotency guard against concurrent duplicate cancellation processing.
-- Preflight: fail fast with a clear error if historical duplicates already exist.
do $$
begin
  if exists (
    select 1
    from public.wallet_ledger
    where source_key = 'OFFLINE_ORDER_CANCELLATION_REFUND'
      and entry_type = 'credit'
      and reference_id is not null
    group by tenant_id, reference_id, source_key
    having count(*) > 1
  ) then
    raise exception using
      message = 'Preflight failed: duplicate OFFLINE_ORDER_CANCELLATION_REFUND ledger rows exist',
      hint = 'Run duplicate audit: group by tenant_id, reference_id, source_key where source_key=OFFLINE_ORDER_CANCELLATION_REFUND and entry_type=credit and reference_id is not null having count(*) > 1; fix rows before applying this migration.';
  end if;
end
$$;

create unique index if not exists wallet_ledger_offline_cancel_refund_once_idx
  on public.wallet_ledger (tenant_id, reference_id, source_key)
  where source_key = 'OFFLINE_ORDER_CANCELLATION_REFUND'
    and entry_type = 'credit'
    and reference_id is not null;
