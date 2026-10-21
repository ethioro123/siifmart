-- Online sales are an operating channel of warehouses and distribution centers.
-- Preserve legacy site IDs for staff, stock, and audit references while retiring them.
revoke all on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb)
from public, anon, authenticated, service_role;

update public.sites
set status = 'Closed',
    is_fulfillment_node = false
where type in ('Dark Store', 'Online Store')
  and (status <> 'Closed' or is_fulfillment_node is distinct from false);

create or replace function private.prevent_online_store_site()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.type in ('Dark Store', 'Online Store') then
      raise exception 'Online sales must use a warehouse or distribution center site';
    end if;
  elsif new.type in ('Dark Store', 'Online Store')
    and (old.type not in ('Dark Store', 'Online Store') or new.status <> 'Closed') then
    raise exception 'Legacy online store sites must remain closed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_online_store_site() from public, anon, authenticated;

drop trigger if exists prevent_online_store_site on public.sites;
create trigger prevent_online_store_site
  before insert or update of type, status on public.sites
  for each row execute function private.prevent_online_store_site();
