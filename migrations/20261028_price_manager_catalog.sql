-- Paged Price Manager reads use the caller's existing products/sites RLS.
CREATE FUNCTION public.search_price_manager_products(
 p_country text, p_filters jsonb DEFAULT '{}', p_search text DEFAULT '',
 p_sort text DEFAULT 'name', p_direction text DEFAULT 'asc',
 p_limit integer DEFAULT 25, p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH actor AS (
 SELECT e.role IN ('group_ceo','group_cfo','country_managing_director','country_operations_director',
 'country_finance_director','country_commercial_director','country_supply_chain_director',
 'regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager',
 'regional_procurement_manager','regional_finance_manager','vendor_relations_manager') AS show_cost
 FROM public.employees e WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,'active'))='active'
 AND e.role IN ('group_ceo','group_cfo','country_managing_director','country_operations_director',
 'country_finance_director','country_commercial_director','country_supply_chain_director',
 'regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager',
 'regional_procurement_manager','regional_finance_manager','vendor_relations_manager',
 'merchandising_specialist','merchandiser','store_operations_auditor')
 ), catalog AS (
 SELECT p.id,p.site_id,s.name AS site_name,p.name,p.sku,p.category,p.brand,p.price,CASE WHEN a.show_cost THEN p.cost_price END AS cost_price,
 p.sale_price,p.is_on_sale,p.stock,p.status,p.location,p.expiry_date,p.batch_number,
 p.shelf_position,p.competitor_price,p.sales_velocity,p.image,p.barcode,p.barcodes,p.barcode_type,
 p.size,p.unit,p.pack_quantity,p.custom_attributes,p.description,p.min_stock,p.max_stock,
 p.approval_status,p.created_at,p.updated_at,
 CASE WHEN p.is_on_sale AND p.sale_price>0 THEN p.sale_price ELSE p.price END AS effective_price
 FROM public.products p JOIN public.sites s ON s.id=p.site_id CROSS JOIN actor a
 WHERE upper(s.country)=upper(p_country) AND coalesce(p.status,'')<>'archived'
 ), margins AS (
 SELECT c.*,CASE WHEN c.effective_price>0 AND c.cost_price>0
 THEN (c.effective_price-c.cost_price)/c.effective_price*100 END AS margin FROM catalog c
 ), filtered AS (
 SELECT m.* FROM margins m
 WHERE (coalesce(p_search,'')='' OR m.name ILIKE '%'||p_search||'%' OR m.sku ILIKE '%'||p_search||'%')
 AND (NOT p_filters ? 'sku' OR m.sku=p_filters->>'sku')
 AND (coalesce(jsonb_array_length(p_filters->'sites'),0)=0 OR m.site_id::text IN (SELECT jsonb_array_elements_text(p_filters->'sites')))
 AND (coalesce(jsonb_array_length(p_filters->'categories'),0)=0 OR m.category IN (SELECT jsonb_array_elements_text(p_filters->'categories')))
 AND (coalesce(jsonb_array_length(p_filters->'velocities'),0)=0 OR m.sales_velocity IN (SELECT jsonb_array_elements_text(p_filters->'velocities')))
 AND (p_filters->>'onSale' IS NULL OR coalesce(m.is_on_sale,false)=(p_filters->>'onSale')::boolean)
 AND (nullif(p_filters->>'minPrice','') IS NULL OR m.effective_price>=(p_filters->>'minPrice')::numeric)
 AND (nullif(p_filters->>'maxPrice','') IS NULL OR m.effective_price<=(p_filters->>'maxPrice')::numeric)
 AND (nullif(p_filters->>'minMargin','') IS NULL OR m.margin>=(p_filters->>'minMargin')::numeric)
 AND (nullif(p_filters->>'maxMargin','') IS NULL OR m.margin<=(p_filters->>'maxMargin')::numeric)
 ), page AS (
 SELECT f.* FROM filtered f ORDER BY
 CASE WHEN p_direction<>'desc' THEN CASE p_sort WHEN 'name' THEN f.name WHEN 'siteId' THEN f.site_name WHEN 'sku' THEN f.sku END END ASC NULLS LAST,
 CASE WHEN p_direction='desc' THEN CASE p_sort WHEN 'name' THEN f.name WHEN 'siteId' THEN f.site_name WHEN 'sku' THEN f.sku END END DESC NULLS LAST,
 CASE WHEN p_direction<>'desc' THEN CASE p_sort WHEN 'price' THEN f.effective_price WHEN 'margin' THEN f.margin WHEN 'competitorPrice' THEN f.competitor_price END END ASC NULLS LAST,
 CASE WHEN p_direction='desc' THEN CASE p_sort WHEN 'price' THEN f.effective_price WHEN 'margin' THEN f.margin WHEN 'competitorPrice' THEN f.competitor_price END END DESC NULLS LAST,
 f.id ASC LIMIT greatest(1,least(coalesce(p_limit,25),100)) OFFSET greatest(0,coalesce(p_offset,0))
 ) SELECT jsonb_build_object('data',coalesce((SELECT jsonb_agg(to_jsonb(page)-ARRAY['margin','effective_price']) FROM page),'[]'),
 'count',(SELECT count(*) FROM filtered));
$$;
REVOKE ALL ON FUNCTION public.search_price_manager_products(text,jsonb,text,text,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.search_price_manager_products(text,jsonb,text,text,text,integer,integer) TO authenticated;
