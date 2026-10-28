-- Preserve existing request preparation rights and whole-number proposals.
CREATE OR REPLACE FUNCTION private.submit_markdown_plan(p_token uuid,p_stage integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence private.markdown_plans%ROWTYPE; p public.products%ROWTYPE; stage jsonb; price_proposed numeric; request uuid; today date;
BEGIN
 SELECT * INTO evidence FROM private.markdown_plans WHERE id=p_token AND employee_id=auth.uid() FOR UPDATE;
 IF evidence.id IS NULL OR NOT private.markdown_scope(evidence.site_id,evidence.country_code) THEN RAISE EXCEPTION 'Plan is unavailable in your authorized scope' USING ERRCODE='42501'; END IF;
 -- Match the existing inventory_requests INSERT policies; SECURITY DEFINER must not broaden preparation rights.
 IF NOT (public.is_ceo() OR (
  evidence.country_code=public.get_my_country_code() AND (public.is_admin() OR EXISTS(SELECT 1 FROM public.sites site
   WHERE site.id=evidence.site_id AND (site.id::text=public.get_my_site_code_or_id() OR site.code=public.get_my_site_code_or_id()))))
  OR private.product_edit_region_scope(evidence.site_id::text)
  OR (lower(public.get_my_role())='merchandising_specialist' AND private.merchandising_site_scope(evidence.site_id::text,evidence.country_code))) THEN
  RAISE EXCEPTION 'Your role cannot prepare product edits at this facility' USING ERRCODE='42501'; END IF;
 IF evidence.request_id IS NOT NULL THEN RETURN jsonb_build_object('requestId',evidence.request_id,'saved',true); END IF;
 today:=(now() AT TIME ZONE CASE evidence.country_code WHEN 'ET' THEN 'Africa/Addis_Ababa' ELSE 'Africa/Nairobi' END)::date;
 IF evidence.created_at<now()-interval '15 minutes' OR evidence.deadline<=today THEN RAISE EXCEPTION 'Plan has expired. Generate a fresh plan'; END IF;
 SELECT * INTO p FROM public.products WHERE id=evidence.product_id FOR UPDATE;
 IF to_jsonb(p) IS DISTINCT FROM evidence.snapshot THEN RAISE EXCEPTION 'Product changed after planning. Refresh and generate a fresh plan' USING ERRCODE='40001'; END IF;
 IF p.expiry_date IS NOT NULL AND (p.expiry_date<=today OR evidence.deadline>p.expiry_date) THEN RAISE EXCEPTION 'Recorded expiry prevents this clearance plan'; END IF;
 IF p_stage IS NULL OR p_stage<0 OR p_stage>=jsonb_array_length(evidence.plan->'stages') THEN RAISE EXCEPTION 'Select a valid price stage'; END IF;
 stage:=evidence.plan->'stages'->p_stage; price_proposed:=(stage->>'price')::numeric;
 IF (stage->>'openingStock')::numeric<=0 OR price_proposed>=(evidence.plan->>'currentPrice')::numeric OR price_proposed<round(p.cost_price) THEN RAISE EXCEPTION 'Selected stage is not eligible for a markdown proposal'; END IF;
 -- Do not include hidden cost in the proposal. Existing approval logic loads the authoritative baseline.
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,proposed_changes,adjustment_reason)
 VALUES(p.id::text,p.name,p.sku,p.site_id::text,evidence.country_code,'edit','pending',
 jsonb_build_object('price',round(p.price),'salePrice',price_proposed,'isOnSale',true),
 'PRICE_CHANGE: Clearance proposal: price '||price_proposed||'; planning deadline '||evidence.deadline||'. Only this price is proposed; later stages are not scheduled.') RETURNING id INTO request;
 UPDATE private.markdown_plans SET request_id=request WHERE id=evidence.id;
 RETURN jsonb_build_object('requestId',request,'saved',true);
END; $$;
REVOKE ALL ON FUNCTION private.submit_markdown_plan(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.submit_markdown_plan(uuid,integer) TO authenticated;
