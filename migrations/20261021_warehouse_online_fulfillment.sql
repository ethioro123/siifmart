-- Move online orders to warehouse fulfillment and create an atomic stock reservation and PICK handoff.
create or replace function public.submit_storefront_order(
  p_site_id uuid,
  p_country_code text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_method text,
  p_delivery_address text,
  p_items jsonb
)
returns table(order_id uuid, order_number text, merchandise_subtotal numeric, currency text)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_site public.sites%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(14,2);
  v_payment_method text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Not authorized';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
      or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Cart must contain between 1 and 20 products';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
      or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 32 then
    raise exception 'Customer name or phone is invalid';
  end if;
  if p_fulfillment_method <> 'delivery' then
    raise exception 'Fulfillment method is invalid';
  end if;
  if p_fulfillment_method = 'delivery'
      and length(trim(coalesce(p_delivery_address, ''))) not between 5 and 500 then
    raise exception 'Delivery address is required';
  end if;

  select s.* into v_site
  from public.sites s
  where s.id = p_site_id
    and s.status = 'Active'
    and s.type = 'Warehouse'
    and upper(s.country) = upper(p_country_code);
  if not found then raise exception 'Store is unavailable'; end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    where coalesce((e->>'quantity')::integer, 0) not between 1 and 20
       or (e->>'product_id') is null
  ) then raise exception 'Cart item is invalid'; end if;
  if exists (
    select e->>'product_id'
    from jsonb_array_elements(p_items) e
    group by e->>'product_id'
    having count(*) > 1
  ) then raise exception 'Cart contains duplicate products'; end if;
  if (
    select count(*) from public.storefront_orders o
    where o.customer_phone = trim(p_customer_phone)
      and o.created_at > now() - interval '15 minutes'
  ) >= 5 then raise exception 'Please wait before sending another order request'; end if;

  if exists (
    with requested as (
      select (e->>'product_id')::uuid as product_id, (e->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items) e
    )
    select 1
    from requested r
    left join public.products p on p.id = r.product_id and p.site_id = v_site.id
    left join public.storefront_catalog c on c.site_id = v_site.id and c.product_id = p.id and c.is_published
    where p.id is null or c.product_id is null or coalesce(p.status, '') <> 'active'
      or coalesce(p.approval_status, '') <> 'approved' or coalesce(p.stock, 0) <= 0
      or coalesce(p.name, '') ~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
      or coalesce(p.category, '') ~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
  ) then raise exception 'A cart product is unavailable'; end if;

  with requested as (
    select (e->>'product_id')::uuid as product_id, (e->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) e
  ), priced as (
    select r.product_id, r.quantity, p.name, p.sku,
      case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end as unit_price
    from requested r
    join public.products p on p.id = r.product_id and p.site_id = v_site.id
    join public.storefront_catalog c on c.site_id = v_site.id and c.product_id = p.id and c.is_published
    where p.status = 'active' and p.approval_status = 'approved' and p.stock > 0
      and coalesce(p.name, '') !~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
      and coalesce(p.category, '') !~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
  )
  select sum(quantity * unit_price)::numeric(14,2) into v_subtotal from priced;

  v_payment_method := case when p_fulfillment_method = 'pickup' then 'cash_on_pickup' else 'cash_on_delivery' end;
  v_order_id := gen_random_uuid();
  v_order_number := 'WEB-' || to_char(now() at time zone 'UTC', 'YYMMDD') || '-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 8));
  insert into public.storefront_orders (
    id, order_number, site_id, country_code, currency, customer_name, customer_phone,
    fulfillment_method, delivery_address, payment_method, merchandise_subtotal
  ) values (
    v_order_id, v_order_number, v_site.id, upper(v_site.country), v_site.currency,
    trim(p_customer_name), trim(p_customer_phone), p_fulfillment_method,
    case when p_fulfillment_method = 'delivery' then trim(p_delivery_address) else null end,
    v_payment_method, coalesce(v_subtotal, 0)
  );

  insert into public.storefront_order_items (order_id, product_id, product_name, sku, quantity, unit_price, line_subtotal)
  select v_order_id, p.id, p.name, p.sku, (e->>'quantity')::integer,
    case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end,
    (e->>'quantity')::integer * case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end
  from jsonb_array_elements(p_items) e
  join public.products p on p.id = (e->>'product_id')::uuid and p.site_id = v_site.id;

  return query select v_order_id, v_order_number, coalesce(v_subtotal, 0), v_site.currency;
end;
$$;

revoke all on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb) to service_role;

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

drop policy if exists storefront_catalog_warehouse_read on public.storefront_catalog;
create policy storefront_catalog_warehouse_read on public.storefront_catalog
  for select to authenticated
  using (public.is_site_in_my_authorized_scope(site_id::text, null));

-- Staff must use the checked transition below. A direct status update could bypass the WMS handoff.
revoke update (status) on public.storefront_orders from authenticated;
drop policy if exists storefront_orders_scoped_status_update on public.storefront_orders;

create or replace function public.decide_storefront_order(p_order_id uuid, p_decision text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth, pg_temp
as $$
declare
  v_order public.storefront_orders%rowtype;
  v_actor public.employees%rowtype;
  v_item public.storefront_order_items%rowtype;
  v_product public.products%rowtype;
  v_reserved numeric;
  v_lines jsonb := '[]'::jsonb;
  v_job_id uuid;
begin
  if auth.uid() is null or p_decision not in ('accepted', 'rejected') then
    raise exception 'Invalid order decision or missing authentication';
  end if;

  select * into v_actor from public.employees where id = auth.uid()
    and lower(coalesce(status, 'active')) = 'active';
  if not found or lower(v_actor.role) not in (
    'warehouse_manager', 'operations_manager', 'logistics_manager',
    'regional_logistics_lead', 'admin', 'super_admin', 'ceo'
  ) then
    raise exception 'Warehouse leadership is required to decide online orders';
  end if;

  select * into v_order from public.storefront_orders where id = p_order_id for update;
  if not found or v_order.status <> 'awaiting_confirmation' then
    raise exception 'This online order is no longer awaiting confirmation';
  end if;
  if not public.is_site_in_my_authorized_scope(v_order.site_id::text, v_order.country_code)
     or not exists (
       select 1 from public.sites s where s.id = v_order.site_id
         and s.type = 'Warehouse' and s.status = 'Active'
         and upper(s.country) = v_order.country_code
     ) then
    raise exception 'Online order is outside the authorized warehouse';
  end if;

  if p_decision = 'rejected' then
    update public.storefront_orders set status = 'rejected' where id = p_order_id;
    return null;
  end if;

  for v_item in
    select * from public.storefront_order_items
    where order_id = p_order_id order by product_id
  loop
    select * into v_product from public.products
    where id = v_item.product_id and site_id = v_order.site_id for update;
    if not found or v_product.status <> 'active'
       or v_product.approval_status <> 'approved' then
      raise exception 'A requested product is no longer available';
    end if;

    select coalesce(sum(r.quantity), 0) into v_reserved
    from public.storefront_stock_reservations r
    where r.product_id = v_item.product_id and r.released_at is null;
    if v_product.stock - v_reserved < v_item.quantity then
      raise exception 'Warehouse stock is insufficient for this order';
    end if;

    insert into public.storefront_stock_reservations (order_id, product_id, quantity)
    values (p_order_id, v_item.product_id, v_item.quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'productId', v_item.product_id, 'name', v_item.product_name,
      'sku', v_item.sku, 'expectedQty', v_item.quantity,
      'pickedQty', 0, 'status', 'Pending'
    ));
  end loop;
  if jsonb_array_length(v_lines) = 0 then
    raise exception 'Online order has no items';
  end if;

  insert into public.wms_jobs (
    country_code, site_id, type, priority, status, items_count,
    location, order_ref, line_items, source_site_id, job_number,
    delivery_method, notes, requested_by
  ) values (
    v_order.country_code, v_order.site_id, 'PICK', 'High', 'Pending',
    jsonb_array_length(v_lines), 'Warehouse pick', v_order.id::text,
    v_lines, v_order.site_id,
    upper(substr(md5(v_order.id::text), 1, 6)),
    'Internal', 'Online order ' || v_order.order_number, v_actor.id::text
  ) returning id into v_job_id;

  update public.storefront_orders
    set status = 'accepted', pick_job_id = v_job_id
    where id = p_order_id;
  return v_job_id;
end;
$$;

revoke all on function public.decide_storefront_order(uuid, text) from public, anon;
grant execute on function public.decide_storefront_order(uuid, text) to authenticated;

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
