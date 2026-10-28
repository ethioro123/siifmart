CREATE OR REPLACE FUNCTION private.submit_price_group(p_country text,p_changes jsonb,p_source text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; p public.products%ROWTYPE; entry jsonb; changes jsonb:='[]'; patch jsonb;
 new_id uuid; existing uuid; fingerprint text; v_country text:=upper(p_country); v_sku text; first_product public.products%ROWTYPE; anchor_patch jsonb;
 finance_count integer:=0; next_p public.products%ROWTYPE; effective numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 IF actor.id IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','country_commercial_director','regional_merchandising_manager','merchandising_specialist','merchandiser') THEN
 RAISE EXCEPTION 'Active merchandising preparation authority required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_changes) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Select between 1 and 2000 product locations'; END IF;
 IF (SELECT count(DISTINCT value->>'productId') FROM jsonb_array_elements(p_changes))<>jsonb_array_length(p_changes) THEN RAISE EXCEPTION 'Duplicate product locations'; END IF;
 SELECT product.sku INTO v_sku FROM public.products product WHERE product.id=(p_changes->0->>'productId')::uuid;
 IF v_sku IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_country||':'||v_sku,0));
 PERFORM product.id FROM public.products product WHERE product.id IN(SELECT (value->>'productId')::uuid FROM jsonb_array_elements(p_changes)) ORDER BY product.id FOR UPDATE;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_changes) ORDER BY value->>'productId' LOOP
  SELECT * INTO p FROM public.products WHERE id=(entry->>'productId')::uuid;
  IF p.id IS NULL OR p.sku IS DISTINCT FROM v_sku OR NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=p.site_id AND upper(s.country)=v_country)
  OR NOT (private.merchandising_site_scope(p.site_id::text,v_country)
    OR (actor.role IN ('country_managing_director','country_commercial_director') AND private.price_review_scope(p.site_id::text,v_country))
    OR (actor.role='group_ceo' AND public.is_site_in_my_authorized_scope(p.site_id::text,v_country))) THEN
   RAISE EXCEPTION 'Every product must be the same SKU in your authorized v_country and territory' USING ERRCODE='42501'; END IF;
  patch:=entry->'proposal';
  IF jsonb_typeof(patch) IS DISTINCT FROM 'object' OR NOT patch ? 'price' OR EXISTS(SELECT 1 FROM jsonb_object_keys(patch) k WHERE k<>ALL(ARRAY['price','salePrice','isOnSale']))
  OR EXISTS(SELECT 1 FROM jsonb_each(patch) field WHERE field.key IN('price','salePrice') AND (jsonb_typeof(field.value)<>'number' OR (field.value::text)::numeric<>round((field.value::text)::numeric)))
  OR (patch ? 'isOnSale' AND jsonb_typeof(patch->'isOnSale')<>'boolean') THEN RAISE EXCEPTION 'Whole-number selling prices only; scoped proposals preserve recorded costs'; END IF;
  next_p:=jsonb_populate_record(p,private.product_edit_patch(patch));
  effective:=CASE WHEN next_p.is_on_sale AND next_p.sale_price>0 THEN next_p.sale_price ELSE next_p.price END;
  IF next_p.price IS NULL OR next_p.price<=0 OR p.cost_price IS NULL OR p.cost_price<=0 OR effective<=0 OR (next_p.is_on_sale AND (next_p.sale_price IS NULL OR next_p.sale_price<=0 OR next_p.sale_price>=next_p.price)) THEN RAISE EXCEPTION 'Every location needs a positive recorded cost and valid selling price'; END IF;
  IF (effective-p.cost_price)*100<effective*15 THEN finance_count:=finance_count+1; END IF;
  changes:=changes||jsonb_build_array(jsonb_build_object('productId',p.id,'siteId',p.site_id,'patch',patch,'baseline',private.price_snapshot(p)));
  IF first_product.id IS NULL AND private.price_snapshot(p) IS DISTINCT FROM private.price_snapshot(next_p) THEN first_product:=p; anchor_patch:=patch; END IF;
 END LOOP;
 IF first_product.id IS NULL THEN RAISE EXCEPTION 'Selected locations already have these prices'; END IF;
 fingerprint:=md5(changes::text);
 SELECT r.id INTO existing FROM public.inventory_requests r JOIN private.price_proposal_targets t ON t.request_id=r.id
 WHERE r.status='pending' AND r.requested_by_employee_id=actor.id AND r.country_code=v_country AND r.product_sku=v_sku
 GROUP BY r.id HAVING md5(jsonb_agg(jsonb_build_object('productId',t.product_id,'siteId',t.site_id,'patch',t.proposed_changes,'baseline',t.pricing_baseline) ORDER BY t.product_id::text)::text)=fingerprint LIMIT 1;
 IF existing IS NOT NULL THEN RETURN jsonb_build_object('requestId',existing,'targetCount',jsonb_array_length(changes),'financeCount',finance_count,'reused',true); END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.status='pending' AND r.change_type='edit' AND
 (r.product_id IN(SELECT value->>'productId' FROM jsonb_array_elements(changes)) OR EXISTS(SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=r.id AND t.product_id::text IN(SELECT value->>'productId' FROM jsonb_array_elements(changes))))) THEN
 RAISE EXCEPTION 'A selected product already has a pending proposal. Review it before submitting another'; END IF;
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(first_product.id::text,first_product.name,v_sku,first_product.site_id::text,v_country,'edit','pending',actor.name,anchor_patch,'PRICE_CHANGE: '||left(coalesce(p_source,'Scoped price change'),200)) RETURNING id INTO new_id;
 INSERT INTO private.price_proposal_targets(request_id,product_id,site_id,country_code,region_code,proposed_changes,pricing_baseline)
 SELECT new_id,(value->>'productId')::uuid,(value->>'siteId')::uuid,v_country,s.region_code,value->'patch',value->'baseline'
 FROM jsonb_array_elements(changes) JOIN public.sites s ON s.id=(value->>'siteId')::uuid;
 RETURN jsonb_build_object('requestId',new_id,'targetCount',jsonb_array_length(changes),'financeCount',finance_count,'reused',false);
END;
$$;
