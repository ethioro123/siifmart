-- Bind retries to their original input and keep receipt generation operational.
ALTER TABLE public.fulfillment_return_requests ADD COLUMN request_fingerprint text;
CREATE INDEX fulfillment_returns_sale ON public.fulfillment_return_requests(sale_id);
CREATE INDEX fulfillment_returns_requester ON public.fulfillment_return_requests(requested_by);
CREATE INDEX fulfillment_returns_decider ON public.fulfillment_return_requests(decided_by);
CREATE OR REPLACE FUNCTION private.submit_fulfillment_return(p_request uuid,p_sale uuid,p_site uuid,p_country text,p_lines jsonb) RETURNS jsonb
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
  IF existing.sale_id<>s.id OR existing.requested_by<>actor.id OR existing.request_fingerprint IS DISTINCT FROM md5(p_lines::text) THEN RAISE EXCEPTION 'Return retry does not match original request'; END IF;
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
 INSERT INTO public.fulfillment_return_requests(id,sale_id,site_id,country_code,currency,lines,refund_amount,requested_by,request_fingerprint)
 VALUES(p_request,s.id,s.site_id,s.country_code,s.currency,normalized,total,actor.id,md5(p_lines::text));
 RETURN jsonb_build_object('id',p_request,'status','pending','refundAmount',total);
END; $$;

CREATE OR REPLACE FUNCTION private.assign_pos_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
    site_row public.sites%ROWTYPE;
    country text;
    region text;
    highest_existing_number bigint;
    next_number bigint;
BEGIN
    IF NEW.site_id IS NULL THEN
        RAISE EXCEPTION 'A site is required to number a POS receipt';
    END IF;

    SELECT * INTO site_row
    FROM public.sites
    WHERE id = NEW.site_id
    FOR SHARE;

    IF NOT FOUND OR site_row.site_number IS NULL THEN
        RAISE EXCEPTION 'The sale site has no receipt site number';
    END IF;

    country := upper(COALESCE(NULLIF(site_row.country, ''), NEW.country_code, 'ET'));
    NEW.country_code := country;

    SELECT upper(reg.code) INTO region
    FROM public.regions AS reg
    WHERE upper(reg.code) = upper(COALESCE(site_row.region_code, ''))
      AND upper(reg.country) = assign_pos_receipt_number.country
      AND reg.code ~ '^[A-Za-z]{3}$'
    FOR SHARE;

    IF region IS NULL THEN
        RAISE EXCEPTION 'The sale site must be assigned to a valid three-letter region code';
    END IF;

    IF COALESCE(NEW.receipt_number, '') LIKE 'OFF-%' THEN
        NEW.offline_receipt_number := COALESCE(NEW.offline_receipt_number, NEW.receipt_number);
    END IF;

    SELECT COALESCE(MAX((regexp_match(
        s.receipt_number,
        '^' || region || '-' || site_row.site_number::text || '([0-9]{6,})$'
    ))[1]::bigint), 0)
    INTO highest_existing_number
    FROM public.sales AS s
    WHERE s.site_id = site_row.id
      AND upper(s.country_code) = country;

    INSERT INTO private.pos_receipt_sequences (country_code, site_id, last_number)
    VALUES (country, site_row.id, highest_existing_number + 1)
    ON CONFLICT (country_code, site_id)
    DO UPDATE SET last_number = GREATEST(
        private.pos_receipt_sequences.last_number + 1,
        EXCLUDED.last_number
    )
    RETURNING last_number INTO next_number;

    NEW.receipt_number := region || '-' || site_row.site_number::text || lpad(next_number::text, 6, '0');
    RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.assign_pos_receipt_number() FROM PUBLIC,anon,authenticated;
