-- Read authorization, paging and specialist narrow-patch regression; all writes roll back.
BEGIN;
DO $$
DECLARE executive uuid; specialist uuid; worker uuid;
BEGIN
 SELECT id INTO executive FROM public.employees WHERE role='group_ceo' AND lower(coalesce(status,'active'))='active' LIMIT 1;
 SELECT e.id INTO specialist FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='merchandising_specialist' AND s.country='ET' AND s.code='ET-HQ' LIMIT 1;
 SELECT id INTO worker FROM public.employees WHERE role='picker' LIMIT 1;
 IF executive IS NULL OR specialist IS NULL OR worker IS NULL THEN RAISE EXCEPTION 'Missing staging fixtures'; END IF;
 PERFORM set_config('test.specialist',specialist::text,true);
 PERFORM set_config('test.worker',worker::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',executive,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE first_page jsonb; next_page jsonb; sample jsonb; result jsonb; request_id uuid;
BEGIN
 first_page:=public.search_price_manager_products('ET','{}','','name','asc',25,0);
 next_page:=public.search_price_manager_products('ET','{}','','name','asc',25,25);
 IF (first_page->>'count')::integer<=25 OR jsonb_array_length(next_page->'data')=0 THEN RAISE EXCEPTION 'Catalog is still limited to startup records'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(first_page->'data') a JOIN jsonb_array_elements(next_page->'data') b ON a->>'id'=b->>'id') THEN RAISE EXCEPTION 'Pages overlap'; END IF;
 sample:=next_page->'data'->0;
 result:=public.search_price_manager_products('ET',jsonb_build_object('sku',sample->>'sku'));
 IF (result->>'count')::integer=0 THEN RAISE EXCEPTION 'SKU beyond startup cache is not searchable'; END IF;
 result:=public.search_price_manager_products('KE',jsonb_build_object('sites',jsonb_build_array(sample->>'site_id')));
 IF (result->>'count')::integer<>0 THEN RAISE EXCEPTION 'Country filter leaked sites'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.worker'),'role','authenticated')::text,true);
 IF (public.search_price_manager_products('ET')->>'count')::integer<>0 THEN RAISE EXCEPTION 'Floor worker accessed Price Manager catalog'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.specialist'),'role','authenticated')::text,true);
 result:=public.search_price_manager_products('ET');
 IF jsonb_array_length(result->'data')=0 THEN RAISE EXCEPTION 'Specialist catalog is empty'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(result->'data') item WHERE item->'cost_price'<>'null'::jsonb) THEN RAISE EXCEPTION 'Specialist cost masking failed'; END IF;
 sample:=result->'data'->0;
 INSERT INTO public.inventory_requests(product_id,site_id,product_name,product_sku,country_code,change_type,status,proposed_changes,adjustment_reason)
 VALUES(sample->>'id',sample->>'site_id',sample->>'name',sample->>'sku','ET','edit','pending',
 '{"unit":"UNIT","minStock":0,"maxStock":50,"packQuantity":1,"customAttributes":{}}','MERCHANDISING: unit and stock policy regression') RETURNING id INTO request_id;
 IF NOT EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=request_id AND status='pending' AND NOT proposed_changes ? 'price') THEN RAISE EXCEPTION 'Specialist narrow proposal failed'; END IF;
END $$;
ROLLBACK;
