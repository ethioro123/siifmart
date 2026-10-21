-- Staff online order intake and decisions at active warehouses or distribution centers.
-- The existing country/site scope and leadership checks remain in each RPC.
create or replace function public.create_online_operations_order(
  p_site_id uuid, p_customer_name text, p_customer_phone text,
  p_delivery_address text, p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private, auth, pg_temp
as $$
declare
  v_actor public.employees%rowtype;
  v_site public.sites%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_subtotal numeric(14,2);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_actor from public.employees
    where id = auth.uid() and lower(coalesce(status, 'active')) = 'active';
  if not found or lower(v_actor.role) not in (
    'warehouse_manager', 'operations_manager', 'logistics_manager',
    'regional_logistics_lead', 'admin', 'super_admin', 'ceo'
  ) then raise exception 'Fulfillment leadership is required'; end if;

  select * into v_site from public.sites
    where id = p_site_id and type in ('Warehouse', 'Distribution Center') and status = 'Active';
  if not found or not public.is_site_in_my_authorized_scope(v_site.id::text, upper(v_site.country)) then
    raise exception 'Fulfillment site is outside the authorized scope';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 32
     or length(trim(coalesce(p_delivery_address, ''))) not between 5 and 500 then
    raise exception 'Customer and delivery details are invalid';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Order must contain between 1 and 20 items';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where (e->>'product_id') is null
      or (e->>'quantity') is null
      or (e->>'quantity') !~ '^[0-9]+$'
      or length(e->>'quantity') > 2
      or (e->>'quantity')::integer not between 1 and 20
  ) then raise exception 'Order item is invalid'; end if;
  if exists (
    select e->>'product_id' from jsonb_array_elements(p_items) e
    group by e->>'product_id' having count(*) > 1
  ) then raise exception 'Order has duplicate products'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    left join public.products p on p.id = (e->>'product_id')::uuid and p.site_id = v_site.id
    where p.id is null or p.status <> 'active' or p.approval_status <> 'approved'
      or coalesce(p.stock, 0) <= 0
      or coalesce(p.name, '') ~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
      or coalesce(p.category, '') ~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
  ) then raise exception 'An order product is unavailable'; end if;

  select sum((e->>'quantity')::integer *
    case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end)::numeric(14,2)
    into v_subtotal
    from jsonb_array_elements(p_items) e
    join public.products p on p.id = (e->>'product_id')::uuid and p.site_id = v_site.id;
  v_order_number := 'OPS-' || to_char(now() at time zone 'UTC', 'YYMMDD') || '-'
    || upper(substr(replace(v_order_id::text, '-', ''), 1, 8));
  insert into public.storefront_orders (
    id, order_number, site_id, country_code, currency, customer_name, customer_phone,
    fulfillment_method, delivery_address, payment_method, merchandise_subtotal
  ) values (
    v_order_id, v_order_number, v_site.id, upper(v_site.country), v_site.currency,
    trim(p_customer_name), trim(p_customer_phone), 'delivery',
    trim(p_delivery_address), 'cash_on_delivery', v_subtotal
  );
  insert into public.storefront_order_items (
    order_id, product_id, product_name, sku, quantity, unit_price, line_subtotal
  )
  select v_order_id, p.id, p.name, p.sku, (e->>'quantity')::integer,
    case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end,
    (e->>'quantity')::integer *
    case when p.is_on_sale and p.sale_price is not null then p.sale_price else p.price end
  from jsonb_array_elements(p_items) e
  join public.products p on p.id = (e->>'product_id')::uuid and p.site_id = v_site.id;
  return v_order_number;
end;
$$;

revoke all on function public.create_online_operations_order(uuid, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.create_online_operations_order(uuid, text, text, text, jsonb)
  to authenticated;

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
    raise exception 'Fulfillment leadership is required to decide online orders';
  end if;

  select * into v_order from public.storefront_orders where id = p_order_id for update;
  if not found or v_order.status <> 'awaiting_confirmation' then
    raise exception 'This online order is no longer awaiting confirmation';
  end if;
  if not public.is_site_in_my_authorized_scope(v_order.site_id::text, v_order.country_code)
     or not exists (
       select 1 from public.sites s where s.id = v_order.site_id
         and s.type in ('Warehouse', 'Distribution Center') and s.status = 'Active'
         and upper(s.country) = v_order.country_code
     ) then
    raise exception 'Online order is outside the authorized fulfillment site';
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
      raise exception 'Fulfillment stock is insufficient for this order';
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
    jsonb_array_length(v_lines), 'Online fulfillment pick', v_order.id::text,
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

revoke all on function public.decide_storefront_order(uuid, text) from public, anon, authenticated;
grant execute on function public.decide_storefront_order(uuid, text) to authenticated;
