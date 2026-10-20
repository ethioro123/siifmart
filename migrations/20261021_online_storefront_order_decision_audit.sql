-- Record the authenticated actor and timestamp whenever staff decide an order request.
alter table public.storefront_orders
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references public.employees(id);

create index if not exists storefront_orders_status_actor_idx
  on public.storefront_orders (status_updated_by, status_updated_at desc)
  where status_updated_by is not null;

create or replace function private.stamp_storefront_order_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.updated_at := clock_timestamp();
    new.status_updated_at := clock_timestamp();
    new.status_updated_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function private.stamp_storefront_order_status() from public, anon, authenticated;

drop trigger if exists storefront_orders_status_audit on public.storefront_orders;
create trigger storefront_orders_status_audit
  before update of status on public.storefront_orders
  for each row execute function private.stamp_storefront_order_status();
