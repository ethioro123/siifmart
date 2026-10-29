-- Return intake is a request, not an unapproved refund or automatic stock restoration.
CREATE TABLE public.fulfillment_return_requests (
 id uuid PRIMARY KEY, sale_id uuid NOT NULL REFERENCES public.sales(id), site_id uuid NOT NULL REFERENCES public.sites(id),
 country_code text NOT NULL, currency text NOT NULL, lines jsonb NOT NULL, refund_amount numeric NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 requested_by uuid NOT NULL REFERENCES public.employees(id), requested_at timestamptz NOT NULL DEFAULT now(),
 decided_by uuid REFERENCES public.employees(id), decided_at timestamptz, decision_reason text,
 CHECK(refund_amount>=0)
);
CREATE INDEX fulfillment_returns_scope_status ON public.fulfillment_return_requests(country_code,site_id,status,requested_at DESC);
ALTER TABLE public.fulfillment_return_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fulfillment_return_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.fulfillment_return_requests TO authenticated;
CREATE POLICY fulfillment_returns_read ON public.fulfillment_return_requests FOR SELECT TO authenticated
 USING(public.is_site_in_my_authorized_scope(site_id::text,country_code) AND public.is_country_in_my_authorized_scope(country_code)
 AND (requested_by=auth.uid() OR public.get_my_role() IN('group_ceo','country_managing_director','country_finance_director','regional_finance_manager','store_manager')));

CREATE FUNCTION private.return_sale_lookup(p_ref text,p_site uuid,p_country text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sale public.sales%ROWTYPE; count_matches integer; actor public.employees%ROWTYPE; items jsonb;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL OR nullif(trim(p_ref),'') IS NULL OR NOT public.is_site_in_my_authorized_scope(p_site::text,p_country)
 OR (actor.role<>'group_ceo' AND actor.site_id IS DISTINCT FROM p_site) OR NOT public.is_country_in_my_authorized_scope(p_country) THEN RAISE EXCEPTION 'Exact receipt and authorized facility required' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO count_matches FROM public.sales WHERE site_id=p_site AND country_code=p_country AND (id::text=trim(p_ref) OR receipt_number=trim(p_ref));
 IF count_matches<>1 THEN RAISE EXCEPTION 'One exact receipt could not be found at this facility'; END IF;
 SELECT * INTO sale FROM public.sales WHERE site_id=p_site AND country_code=p_country AND (id::text=trim(p_ref) OR receipt_number=trim(p_ref));
 IF sale.status NOT IN('Completed','Partially Refunded') THEN RAISE EXCEPTION 'This receipt is not eligible for return intake'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',si.id,'productId',si.product_id,'name',si.product_name,'quantity',greatest(0,si.quantity-coalesce((
  SELECT sum((l->>'quantity')::numeric) FROM public.fulfillment_return_requests r CROSS JOIN LATERAL jsonb_array_elements(r.lines) l
  WHERE r.sale_id=sale.id AND r.status IN('pending','approved') AND l->>'saleItemId'=si.id::text),0)),
  'price',CASE WHEN total.extended>0 THEN round(si.price*sale.total/total.extended,2) ELSE 0 END) ORDER BY si.id) INTO items
 FROM public.sale_items si CROSS JOIN LATERAL(SELECT sum(quantity*price) extended FROM public.sale_items WHERE sale_id=sale.id) total WHERE si.sale_id=sale.id;
 RETURN jsonb_build_object('id',sale.id,'receiptNumber',sale.receipt_number,'siteId',sale.site_id,'countryCode',sale.country_code,'currency',sale.currency,'items',coalesce(items,'[]'),'total',sale.total);
END; $$;
REVOKE ALL ON FUNCTION private.return_sale_lookup(text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.return_sale_lookup(text,uuid,text) TO authenticated;
CREATE FUNCTION public.return_sale_lookup(p_ref text,p_site uuid,p_country text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.return_sale_lookup(p_ref,p_site,p_country); $$;
REVOKE ALL ON FUNCTION public.return_sale_lookup(text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.return_sale_lookup(text,uuid,text) TO authenticated;

CREATE FUNCTION private.submit_fulfillment_return(p_request uuid,p_sale uuid,p_site uuid,p_country text,p_lines jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.sales%ROWTYPE; si public.sale_items%ROWTYPE; actor public.employees%ROWTYPE; existing public.fulfillment_return_requests%ROWTYPE;
 line jsonb; normalized jsonb:='[]'; qty numeric; already numeric; total numeric:=0; extended numeric; refund numeric; duplicate_ids text[]:='{}';
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO s FROM public.sales WHERE id=p_sale FOR UPDATE;
 IF actor.id IS NULL OR s.id IS NULL OR p_site IS DISTINCT FROM s.site_id OR p_country IS DISTINCT FROM s.country_code
 OR NOT public.is_site_in_my_authorized_scope(s.site_id::text,s.country_code) OR NOT public.is_country_in_my_authorized_scope(s.country_code)
 OR (actor.role<>'group_ceo' AND actor.site_id IS DISTINCT FROM s.site_id) THEN RAISE EXCEPTION 'Return intake is outside the authorized facility' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM public.fulfillment_return_requests WHERE id=p_request;
 IF existing.id IS NOT NULL THEN
  IF existing.sale_id<>s.id OR existing.requested_by<>actor.id THEN RAISE EXCEPTION 'Return retry does not match original request'; END IF;
  RETURN jsonb_build_object('id',existing.id,'status',existing.status,'refundAmount',existing.refund_amount);
 END IF;
 IF p_request IS NULL OR s.status NOT IN('Completed','Partially Refunded') OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'An eligible receipt and return lines are required'; END IF;
 SELECT sum(quantity*price) INTO extended FROM public.sale_items WHERE sale_id=s.id;
 IF extended IS NULL OR extended<=0 OR s.total<0 THEN RAISE EXCEPTION 'Original paid amounts require supervisor review'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
  SELECT * INTO si FROM public.sale_items WHERE id=(line->>'saleItemId')::uuid AND sale_id=s.id;
  qty:=(line->>'quantity')::numeric;
  IF si.id IS NULL OR si.product_id IS NULL OR si.id::text=ANY(duplicate_ids) OR qty IS NULL OR qty::text IN('NaN','Infinity','-Infinity') OR qty<=0 OR qty<>trunc(qty)
   OR length(trim(coalesce(line->>'reason','')))<3 OR coalesce(line->>'action','') NOT IN('Restock','Discard','Repair')
   OR coalesce(line->>'condition','') NOT IN('New / Sealed','Open Box','Damaged') THEN RAISE EXCEPTION 'Return lines require valid counts, reason, condition and disposition'; END IF;
  IF line->>'action'='Restock' AND line->>'condition'<>'New / Sealed' THEN RAISE EXCEPTION 'Only sealed goods can be proposed for restock; hold other returns for review'; END IF;
  SELECT coalesce(sum((l->>'quantity')::numeric),0) INTO already FROM public.fulfillment_return_requests r CROSS JOIN LATERAL jsonb_array_elements(r.lines) l
   WHERE r.sale_id=s.id AND r.status IN('pending','approved') AND l->>'saleItemId'=si.id::text;
  IF qty+already>si.quantity THEN RAISE EXCEPTION 'Returned quantity exceeds the unreturned original sale line'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=si.product_id AND site_id=s.site_id) THEN RAISE EXCEPTION 'Original product requires site-specific stock review'; END IF;
  refund:=round(si.price*qty*s.total/extended,2);total:=total+refund;
  normalized:=normalized||jsonb_build_array(jsonb_build_object('saleItemId',si.id,'productId',si.product_id,'name',si.product_name,'quantity',qty,'reason',line->>'reason','condition',line->>'condition','action',line->>'action','refundAmount',refund));
  duplicate_ids:=array_append(duplicate_ids,si.id::text);
 END LOOP;
 -- Rounding and previous returns can never produce a credit above the original paid total.
 SELECT least(total,greatest(0,s.total-coalesce(sum(refund_amount),0))) INTO total FROM public.fulfillment_return_requests WHERE sale_id=s.id AND status IN('pending','approved');
 INSERT INTO public.fulfillment_return_requests(id,sale_id,site_id,country_code,currency,lines,refund_amount,requested_by)
 VALUES(p_request,s.id,s.site_id,s.country_code,s.currency,normalized,total,actor.id);
 RETURN jsonb_build_object('id',p_request,'status','pending','refundAmount',total);
END; $$;
REVOKE ALL ON FUNCTION private.submit_fulfillment_return(uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.submit_fulfillment_return(uuid,uuid,uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.submit_fulfillment_return(p_request uuid,p_sale uuid,p_site uuid,p_country text,p_lines jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.submit_fulfillment_return(p_request,p_sale,p_site,p_country,p_lines); $$;
REVOKE ALL ON FUNCTION public.submit_fulfillment_return(uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_fulfillment_return(uuid,uuid,uuid,text,jsonb) TO authenticated;

CREATE FUNCTION private.decide_fulfillment_return(p_request uuid,p_approve boolean,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.fulfillment_return_requests%ROWTYPE; actor public.employees%ROWTYPE; line jsonb; remaining boolean; s public.sales%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO r FROM public.fulfillment_return_requests WHERE id=p_request;
 SELECT * INTO s FROM public.sales WHERE id=r.sale_id FOR UPDATE;
 SELECT * INTO r FROM public.fulfillment_return_requests WHERE id=p_request FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_finance_director','regional_finance_manager','store_manager')
 OR actor.id=r.requested_by OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code) OR NOT public.is_country_in_my_authorized_scope(r.country_code)
 OR length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Independent authorized supervisor and decision reason required' USING ERRCODE='42501'; END IF;
 IF r.status<>'pending' THEN RETURN jsonb_build_object('id',r.id,'status',r.status); END IF;
 IF p_approve IS NULL THEN RAISE EXCEPTION 'Choose approve or reject'; END IF;
 IF p_approve THEN
  FOR line IN SELECT value FROM jsonb_array_elements(r.lines) LOOP
   IF line->>'action'='Restock' THEN
    INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,requested_by,requested_by_employee_id,status,adjustment_type,adjustment_qty,adjustment_reason)
    SELECT p.id::text,p.name,p.sku,r.site_id::text,r.country_code,'stock_adjustment',e.name,r.requested_by,'pending','IN',(line->>'quantity')::integer,'RMA restock request '||r.id::text FROM public.products p JOIN public.employees e ON e.id=r.requested_by WHERE p.id=(line->>'productId')::uuid AND p.site_id=r.site_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Returned product is no longer available at this facility'; END IF;
   END IF;
  END LOOP;
  UPDATE public.fulfillment_return_requests SET status='approved',decided_by=actor.id,decided_at=now(),decision_reason=p_reason WHERE id=r.id;
  -- Approval authorizes a credit; cash/card settlement and sale financial status are separate.

 ELSE
  UPDATE public.fulfillment_return_requests SET status='rejected',decided_by=actor.id,decided_at=now(),decision_reason=p_reason WHERE id=r.id;
 END IF;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('RETURN_DECIDED','Fulfillment',actor.name,actor.id,r.site_id,r.country_code,'return',r.id::text,jsonb_build_object('approved',p_approve,'creditAmount',r.refund_amount,'currency',r.currency,'reason',p_reason,'settlement','separate'));
 RETURN jsonb_build_object('id',r.id,'status',CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END);
END; $$;
REVOKE ALL ON FUNCTION private.decide_fulfillment_return(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.decide_fulfillment_return(uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.decide_fulfillment_return(p_request uuid,p_approve boolean,p_reason text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.decide_fulfillment_return(p_request,p_approve,p_reason); $$;
REVOKE ALL ON FUNCTION public.decide_fulfillment_return(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_fulfillment_return(uuid,boolean,text) TO authenticated;
