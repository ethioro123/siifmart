-- Rollback-only staging regression for online order reservation and warehouse handoff.
begin;

select set_config('request.jwt.claim.role', 'service_role', true);

update public.products set stock = 1
where id = '10017275-4dc5-44f4-9b41-eeec04f36a92';

do $$
declare
  v_first uuid;
  v_number text;
  v_second uuid;
  v_pick uuid;
  v_pack uuid;
  v_failed boolean := false;
begin
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'e2000000-0000-4000-8000-000000000037', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e2000000-0000-4000-8000-000000000037"}', true);
  begin
    perform public.create_online_operations_order(
      'a1111111-1111-4000-8000-000000000005',
      'Warehouse Test', '251911000001', 'Test street, Addis Ababa',
      '[{"product_id":"10017275-4dc5-44f4-9b41-eeec04f36a92","quantity":1}]'::jsonb);
  exception when others then v_failed := true; end;
  if not v_failed then raise exception 'Kenya manager entered an Ethiopia order'; end if;

  v_failed := false;
  perform set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000040', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e1000000-0000-4000-8000-000000000040"}', true);
  begin
    perform public.create_online_operations_order(
      'a1111111-1111-4000-8000-000000000005',
      'Warehouse Test', '251911000001', 'Test street, Addis Ababa',
      '[{"product_id":"10017275-4dc5-44f4-9b41-eeec04f36a92","quantity":1}]'::jsonb);
  exception when others then v_failed := true; end;
  if not v_failed then raise exception 'Picker entered an online order'; end if;

  v_failed := false;
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000037', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e1000000-0000-4000-8000-000000000037"}', true);
  v_number := public.create_online_operations_order(
      'a1111111-1111-4000-8000-000000000005',
      'Warehouse Test', '251911000001', 'Test street, Addis Ababa',
      '[{"product_id":"10017275-4dc5-44f4-9b41-eeec04f36a92","quantity":1}]'::jsonb);
  select id into v_first from public.storefront_orders where order_number = v_number;
  v_number := public.create_online_operations_order(
      'a1111111-1111-4000-8000-000000000005',
      'Warehouse Test', '251911000002', 'Test street, Addis Ababa',
      '[{"product_id":"10017275-4dc5-44f4-9b41-eeec04f36a92","quantity":1}]'::jsonb);
  select id into v_second from public.storefront_orders where order_number = v_number;
  if v_first is null or v_second is null then raise exception 'Staff order intake failed'; end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'e2000000-0000-4000-8000-000000000037', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e2000000-0000-4000-8000-000000000037"}', true);
  begin
    perform public.decide_storefront_order(v_first, 'accepted');
  exception when others then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Kenya manager accepted an Ethiopia order'; end if;

  v_failed := false;
  perform set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000040', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e1000000-0000-4000-8000-000000000040"}', true);
  begin
    perform public.decide_storefront_order(v_first, 'accepted');
  exception when others then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Picker accepted an online order'; end if;

  perform set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000037', true);
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"e1000000-0000-4000-8000-000000000037"}', true);

  select public.decide_storefront_order(v_first, 'accepted') into v_pick;
  if v_pick is null or not exists (
    select 1 from public.storefront_orders
    where id = v_first and status = 'accepted' and pick_job_id = v_pick
  ) then raise exception 'Acceptance did not create a linked PICK'; end if;
  if not exists (
    select 1 from public.storefront_stock_reservations
    where order_id = v_first and quantity = 1 and released_at is null
  ) then raise exception 'Stock was not reserved'; end if;

  begin
    perform public.decide_storefront_order(v_second, 'accepted');
  exception when others then
    v_failed := true;
  end;
  if not v_failed or not exists (
    select 1 from public.storefront_orders
    where id = v_second and status = 'awaiting_confirmation' and pick_job_id is null
  ) then raise exception 'Oversell was not blocked'; end if;

  update public.wms_jobs
    set status = 'Completed', completed_by = 'e1000000-0000-4000-8000-000000000037',
        completed_at = now(),
        line_items = jsonb_build_array(jsonb_build_object(
          'productId', '10017275-4dc5-44f4-9b41-eeec04f36a92',
          'name', 'Multi-Enzyme Laundry Detergent Powder 2kg',
          'sku', (select sku from public.products where id = '10017275-4dc5-44f4-9b41-eeec04f36a92'),
          'expectedQty', 1, 'pickedQty', 1, 'status', 'Completed'
        ))
    where id = v_pick;

  if (select stock from public.products where id = '10017275-4dc5-44f4-9b41-eeec04f36a92') <> 0
     or not exists (select 1 from public.storefront_stock_reservations
       where order_id = v_first and released_at is not null)
     or not exists (select 1 from public.stock_movements
       where reason like 'Online order % warehouse pick' and product_id = '10017275-4dc5-44f4-9b41-eeec04f36a92')
  then raise exception 'Physical pick did not debit and release atomically'; end if;

  select id into v_pack from public.create_pack_job_after_completed_pick(v_pick) limit 1;
  if v_pack is null then raise exception 'Completed online PICK did not hand off to PACK'; end if;
end;
$$;

rollback;
