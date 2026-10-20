-- Public, country-scoped storefront catalog and guest order requests.
-- Orders remain requests until an authorized staff member accepts them.

create table if not exists public.storefront_catalog (
  site_id uuid not null references public.sites(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, product_id)
);

create index if not exists storefront_catalog_published_site_idx
  on public.storefront_catalog (site_id, product_id)
  where is_published;

create table if not exists public.storefront_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  site_id uuid not null references public.sites(id),
  country_code text not null check (country_code in ('ET', 'KE')),
  currency text not null check (currency in ('ETB', 'KES')),
  customer_name text not null check (length(customer_name) between 2 and 120),
  customer_phone text not null check (length(customer_phone) between 7 and 32),
  fulfillment_method text not null check (fulfillment_method in ('delivery', 'pickup')),
  delivery_address text,
  payment_method text not null check (payment_method in ('cash_on_delivery', 'cash_on_pickup')),
  status text not null default 'awaiting_confirmation'
    check (status in ('awaiting_confirmation', 'accepted', 'rejected')),
  payment_status text not null default 'unpaid' check (payment_status = 'unpaid'),
  merchandise_subtotal numeric(14,2) not null check (merchandise_subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (fulfillment_method = 'delivery' and payment_method = 'cash_on_delivery'
      and delivery_address is not null and length(delivery_address) between 5 and 500)
    or
    (fulfillment_method = 'pickup' and payment_method = 'cash_on_pickup'
      and delivery_address is null)
  )
);

create index if not exists storefront_orders_site_created_idx
  on public.storefront_orders (site_id, created_at desc);
create index if not exists storefront_orders_country_created_idx
  on public.storefront_orders (country_code, created_at desc);

create table if not exists public.storefront_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.storefront_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_subtotal numeric(14,2) not null check (line_subtotal >= 0),
  unique (order_id, product_id)
);

create index if not exists storefront_order_items_order_idx
  on public.storefront_order_items (order_id);

alter table public.storefront_catalog enable row level security;
alter table public.storefront_orders enable row level security;
alter table public.storefront_order_items enable row level security;

revoke all on public.storefront_catalog, public.storefront_orders, public.storefront_order_items from anon, authenticated;
grant select, insert, update, delete on public.storefront_catalog to authenticated;
grant select on public.storefront_orders, public.storefront_order_items to authenticated;
grant update (status) on public.storefront_orders to authenticated;
grant all on public.storefront_catalog, public.storefront_orders, public.storefront_order_items to service_role;

drop policy if exists storefront_catalog_merchandising_select on public.storefront_catalog;
create policy storefront_catalog_merchandising_select on public.storefront_catalog
  for select to authenticated
  using (private.merchandising_site_scope(site_id::text, null));

drop policy if exists storefront_catalog_merchandising_insert on public.storefront_catalog;
create policy storefront_catalog_merchandising_insert on public.storefront_catalog
  for insert to authenticated
  with check (private.merchandising_site_scope(site_id::text, null));

drop policy if exists storefront_catalog_merchandising_update on public.storefront_catalog;
create policy storefront_catalog_merchandising_update on public.storefront_catalog
  for update to authenticated
  using (private.merchandising_site_scope(site_id::text, null))
  with check (private.merchandising_site_scope(site_id::text, null));

drop policy if exists storefront_catalog_merchandising_delete on public.storefront_catalog;
create policy storefront_catalog_merchandising_delete on public.storefront_catalog
  for delete to authenticated
  using (private.merchandising_site_scope(site_id::text, null));

drop policy if exists storefront_orders_scoped_read on public.storefront_orders;
create policy storefront_orders_scoped_read on public.storefront_orders
  for select to authenticated
  using (is_site_in_my_authorized_scope(site_id::text, country_code));

drop policy if exists storefront_orders_scoped_status_update on public.storefront_orders;
create policy storefront_orders_scoped_status_update on public.storefront_orders
  for update to authenticated
  using (
    status = 'awaiting_confirmation'
    and is_site_in_my_authorized_scope(site_id::text, country_code)
  )
  with check (
    status in ('accepted', 'rejected')
    and is_site_in_my_authorized_scope(site_id::text, country_code)
  );

drop policy if exists storefront_order_items_scoped_read on public.storefront_order_items;
create policy storefront_order_items_scoped_read on public.storefront_order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.storefront_orders o
      where o.id = order_id
        and is_site_in_my_authorized_scope(o.site_id::text, o.country_code)
    )
  );

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
  if p_fulfillment_method not in ('delivery', 'pickup') then
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
    and s.type = 'Dark Store'
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
