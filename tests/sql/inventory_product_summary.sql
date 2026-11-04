BEGIN;
DO $$
DECLARE worker public.employees%ROWTYPE; home public.sites%ROWTYPE; foreign_site uuid;
 fixture_sku text:='ET-SUMMARY-'||gen_random_uuid()::text; first_id uuid:=gen_random_uuid(); second_id uuid:=gen_random_uuid(); result record;
BEGIN
 SELECT e.* INTO worker FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='receiver' AND lower(e.status)='active' AND s.country='ET' ORDER BY e.id LIMIT 1;
 SELECT * INTO home FROM public.sites WHERE id=worker.site_id;
 SELECT id INTO foreign_site FROM public.sites WHERE country='KE' AND type IN('Warehouse','Store','Distribution Center') LIMIT 1;
 ASSERT worker.id IS NOT NULL AND foreign_site IS NOT NULL;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.products(id,site_id,name,sku,category,stock,price,status,location,batch_number) VALUES
 (first_id,home.id,'Summary fixture',fixture_sku,'Dishes, Plates & Bowls',10,5,'active','A-01-01','LOT-A'),
 (second_id,home.id,'Summary fixture',fixture_sku,'Dishes, Plates & Bowls',20,5,'active','A-01-02','LOT-B'),
 (gen_random_uuid(),home.id,'Summary fixture',fixture_sku,'Dishes, Plates & Bowls',0,5,'out_of_stock','On Order',NULL),
 (gen_random_uuid(),foreign_site,'Foreign summary fixture',fixture_sku,'Dishes, Plates & Bowls',900,5,'active','A-01-01','LOT-C');
 PERFORM set_config('request.jwt.claim.sub',worker.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',worker.id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 SELECT * INTO result FROM public.inventory_product_summary WHERE site_id=home.id AND country_code='ET' AND inventory_key=upper(regexp_replace(fixture_sku,'[-\s]','','g'));
 ASSERT result.stock=30 AND result.location_count=2,'All locations must be summed once';
 ASSERT result.location_stock IN(10,20),'Original record stock must remain available for scoped actions';
 ASSERT (SELECT count(*) FROM public.inventory_product_summary WHERE site_id=home.id AND sku=result.sku)=1,'One row per product before pagination';
 ASSERT result.location_search LIKE '%A-01-02%','Search must include other bins';
 ASSERT (SELECT count(*) FROM public.inventory_stock_locations WHERE site_id=home.id AND sku=result.sku)=3,'Location and lot evidence must remain intact';
 ASSERT NOT EXISTS(SELECT 1 FROM public.inventory_product_summary WHERE site_id=foreign_site AND sku=result.sku),'Invoker RLS must preserve country isolation';
 ASSERT NOT has_table_privilege('anon','public.inventory_product_summary','SELECT');
 EXECUTE 'RESET ROLE';
END $$;
ROLLBACK;
