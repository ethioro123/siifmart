-- Correct the checkout return type and expose stock available after warehouse reservations.
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
      or coalesce(p.approval_status, '') <> 'approved'
      or coalesce(p.stock, 0) - coalesce((
        select sum(r2.quantity) from public.storefront_stock_reservations r2
        where r2.product_id = p.id and r2.released_at is null
      ), 0) < r.quantity
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
    where p.status = 'active' and p.approval_status = 'approved'
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

  return query select v_order_id, v_order_number, coalesce(v_subtotal, 0), v_site.currency::text;
end;
$$;

revoke all on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_storefront_order(uuid, text, text, text, text, text, jsonb) to service_role;

create or replace function public.storefront_available_stock(p_site_ids uuid[])
returns table(product_id uuid, available numeric)
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
  select p.id, greatest(0, p.stock - coalesce(sum(r.quantity), 0))
  from public.products p
  left join public.storefront_stock_reservations r
    on r.product_id = p.id and r.released_at is null
  where p.site_id = any(p_site_ids)
  group by p.id, p.stock;
$$;

revoke all on function public.storefront_available_stock(uuid[]) from public, anon, authenticated;
grant execute on function public.storefront_available_stock(uuid[]) to service_role;
