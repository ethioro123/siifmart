-- Operational stock reservations and PICK completion for staff online orders.
-- Guest checkout is not granted or installed by this migration.
alter table public.storefront_orders
  add column if not exists pick_job_id uuid unique references public.wms_jobs(id);

create index if not exists storefront_orders_pick_job_idx
  on public.storefront_orders (pick_job_id) where pick_job_id is not null;

create table if not exists public.storefront_stock_reservations (
  order_id uuid not null references public.storefront_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  released_at timestamptz,
  primary key (order_id, product_id)
);

create index if not exists storefront_stock_reservations_active_product_idx
  on public.storefront_stock_reservations (product_id) where released_at is null;

alter table public.storefront_stock_reservations enable row level security;
revoke all on public.storefront_stock_reservations from public, anon, authenticated;
grant all on public.storefront_stock_reservations to service_role;

-- Staff must use the checked transition below. A direct status update could bypass the WMS handoff.
revoke update (status) on public.storefront_orders from authenticated;
drop policy if exists storefront_orders_scoped_status_update on public.storefront_orders;

-- All stock writers must preserve units already promised to accepted web orders.
create or replace function private.preserve_storefront_reservations()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare v_reserved numeric;
begin
  if new.stock >= old.stock then return new; end if;
  select coalesce(sum(quantity), 0) into v_reserved
  from public.storefront_stock_reservations
  where product_id = new.id and released_at is null;
  if new.stock < v_reserved then
    raise exception 'Stock is reserved for an accepted online order';
  end if;
  return new;
end;
$$;

revoke all on function private.preserve_storefront_reservations() from public, anon, authenticated;
drop trigger if exists preserve_storefront_reservations on public.products;
create trigger preserve_storefront_reservations
  before update of stock on public.products
  for each row execute function private.preserve_storefront_reservations();

-- The physical pick, stock decrement, movement and reservation release share one transaction.
create or replace function private.complete_storefront_pick()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth, pg_temp
as $$
declare
  v_order public.storefront_orders%rowtype;
  v_reservation public.storefront_stock_reservations%rowtype;
  v_product public.products%rowtype;
  v_line jsonb;
  v_actor uuid;
begin
  if new.type <> 'PICK' or new.status <> 'Completed'
     or old.status = 'Completed' then return new; end if;
  select * into v_order from public.storefront_orders
  where pick_job_id = new.id for update;
  if not found then return new; end if;

  v_actor := public.get_my_employee_id();
  if v_actor is null or new.completed_by is distinct from v_actor::text
     or not public.is_site_in_my_authorized_scope(v_order.site_id::text, v_order.country_code)
     or v_order.status <> 'accepted'
     or new.site_id <> v_order.site_id or new.country_code <> v_order.country_code
     or new.order_ref <> v_order.id::text then
    raise exception 'Invalid online warehouse pick completion';
  end if;

  if jsonb_typeof(new.line_items) <> 'array'
     or jsonb_array_length(new.line_items) <> (
       select count(*) from public.storefront_stock_reservations where order_id = v_order.id
     ) then
    raise exception 'Online pick manifest is incomplete';
  end if;

  for v_reservation in
    select * from public.storefront_stock_reservations
    where order_id = v_order.id and released_at is null order by product_id
  loop
    select value into v_line from jsonb_array_elements(new.line_items)
    where value->>'productId' = v_reservation.product_id::text;
    if not found or (v_line->>'expectedQty')::numeric <> v_reservation.quantity
       or (v_line->>'pickedQty')::numeric <> v_reservation.quantity
       or v_line->>'status' = 'Short' then
      raise exception 'Resolve every online pick shortage before completing the job';
    end if;

    update public.storefront_stock_reservations set released_at = now()
    where order_id = v_order.id and product_id = v_reservation.product_id;
    update public.products set stock = stock - v_reservation.quantity
    where id = v_reservation.product_id and site_id = v_order.site_id
      and stock >= v_reservation.quantity
    returning * into v_product;
    if not found then raise exception 'Warehouse stock changed during online picking'; end if;

    insert into public.stock_movements (
      site_id, product_id, product_name, type, quantity, movement_date,
      performed_by, reason
    ) values (
      v_order.site_id, v_product.id, v_product.name, 'OUT',
      v_reservation.quantity, now(), v_actor::text,
      'Online order ' || v_order.order_number || ' warehouse pick'
    );
  end loop;
  return new;
end;
$$;

revoke all on function private.complete_storefront_pick() from public, anon, authenticated;
drop trigger if exists complete_storefront_pick on public.wms_jobs;
create trigger complete_storefront_pick
  before update of status on public.wms_jobs
  for each row execute function private.complete_storefront_pick();
