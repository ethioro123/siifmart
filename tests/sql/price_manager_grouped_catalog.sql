-- Uses existing staging catalog; no business data is changed.
BEGIN;
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000201","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE grouped jsonb; raw jsonb; next_page jsonb; first_page jsonb; represented integer;
BEGIN
 grouped := public.search_price_manager_products('ET','{"groupBySku":true}','','name','asc',100,0);
 raw := public.search_price_manager_products('ET','{}','','name','asc',100,0);
 IF (grouped->>'count')::integer >= (raw->>'count')::integer THEN RAISE EXCEPTION 'Fixture expected repeated SKU records'; END IF;
 SELECT sum((p->'price_group'->>'recordCount')::integer) INTO represented FROM jsonb_array_elements(grouped->'data') p;
 IF represented<>(raw->>'count')::integer THEN RAISE EXCEPTION 'Grouped records lost or double counted'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(grouped->'data') p WHERE p->>'cost_price' IS NOT NULL OR p->'price_group'->>'minMargin' IS NOT NULL)
 THEN RAISE EXCEPTION 'Specialist cost masking failed'; END IF;
 first_page := public.search_price_manager_products('ET','{"groupBySku":true}','','name','asc',1,0);
 next_page := public.search_price_manager_products('ET','{"groupBySku":true}','','name','asc',1,1);
 IF first_page->'data'->0->>'sku'=next_page->'data'->0->>'sku' THEN RAISE EXCEPTION 'SKU repeated across pages'; END IF;
 IF (public.search_price_manager_products('ET','{"groupBySku":true,"sku":"etdy001"}','','name','asc',100,0)->>'count')::integer<>1
 THEN RAISE EXCEPTION 'Normalized SKU targets not matched'; END IF;
 IF (public.search_price_manager_products('KE','{"groupBySku":true}','','name','asc',100,0)->>'count')::integer<>0
 THEN RAISE EXCEPTION 'Country boundary failed'; END IF;
END $$;
ROLLBACK;
