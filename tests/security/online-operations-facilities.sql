-- Rollback-only regression for DC order intake, reservation, and national scope.
begin;
do $$
declare
  v_actor uuid;
  v_site uuid;
  v_product uuid;
  v_country text;
  v_number text;
  v_order uuid;
  v_pick uuid;
  v_other_site uuid;
  v_failed boolean;
begin
  select id into v_other_site from public.sites where type in ('Dark Store', 'Online Store') limit 1;
  if v_other_site is not null then
    v_failed := false;
    begin
      update public.sites set status = 'Active' where id = v_other_site;
    exception when raise_exception then
      if sqlerrm <> 'Legacy online store sites must remain closed' then raise; end if;
      v_failed := true;
    end;
    if not v_failed then raise exception 'A retired online store site was reopened'; end if;
  end if;

  select e.id, s.id, p.id, upper(s.country)
  into v_actor, v_site, v_product, v_country
  from public.sites s
  join public.employees e on e.site_id = s.id
  join public.products p on p.site_id = s.id
  where s.type = 'Distribution Center' and s.status = 'Active'
    and lower(e.role) = 'warehouse_manager' and lower(e.status) = 'active'
    and p.status = 'active' and p.approval_status = 'approved' and p.stock > 0
    and coalesce(p.name, '') !~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
    and coalesce(p.category, '') !~* '(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)'
  order by s.country, s.code, e.id, p.id limit 1;
  if v_actor is null then raise exception 'DC regression fixture is missing'; end if;
  perform set_config('request.jwt.claim.sub', v_actor::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_actor, 'role', 'authenticated')::text, true);

  v_number := public.create_online_operations_order(v_site,
    'Operations regression', '251911000001', 'Test delivery address',
    jsonb_build_array(jsonb_build_object('product_id', v_product, 'quantity', 1)));
  select id into v_order from public.storefront_orders where order_number = v_number;
  v_pick := public.decide_storefront_order(v_order, 'accepted');
  if not exists (select 1 from public.wms_jobs
    where id = v_pick and site_id = v_site and country_code = v_country and type = 'PICK') then
    raise exception 'DC order did not create a scoped PICK job';
  end if;

  select id into v_other_site from public.sites
    where upper(country) <> v_country and type = 'Distribution Center' and status = 'Active' limit 1;
  if v_other_site is null then raise exception 'Foreign country fixture is missing'; end if;
  v_failed := false;
  begin
    perform public.create_online_operations_order(v_other_site,
      'Operations regression', '251911000001', 'Test delivery address',
      jsonb_build_array(jsonb_build_object('product_id', v_product, 'quantity', 1)));
  exception when others then v_failed := true; end;
  if not v_failed then raise exception 'DC manager created an order in another country'; end if;

  select id into v_other_site from public.sites where type = 'Store' and upper(country) = v_country limit 1;
  v_failed := false;
  begin
    perform public.create_online_operations_order(v_other_site,
      'Operations regression', '251911000001', 'Test delivery address',
      jsonb_build_array(jsonb_build_object('product_id', v_product, 'quantity', 1)));
  exception when others then v_failed := true; end;
  if not v_failed then raise exception 'A retail store accepted online operational intake'; end if;

  if exists (select 1 from public.sites where type in ('Dark Store', 'Online Store')
    and (status <> 'Closed' or is_fulfillment_node)) then
    raise exception 'A legacy online store is still an operational facility';
  end if;
end;
$$;
rollback;
