-- Internal warehouse order intake. No guest or service-role checkout is exposed.
revoke all on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb)
  from public, anon, authenticated, service_role;

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
  ) then raise exception 'Warehouse leadership is required'; end if;

  select * into v_site from public.sites
    where id = p_site_id and type = 'Warehouse' and status = 'Active';
  if not found or not public.is_site_in_my_authorized_scope(v_site.id::text, upper(v_site.country)) then
    raise exception 'Warehouse is outside the authorized scope';
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
