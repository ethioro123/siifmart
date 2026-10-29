CREATE OR REPLACE FUNCTION public.open_counter_shift(p_site uuid,p_counter text,p_float numeric,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; s public.sites%ROWTYPE; r public.shifts%ROWTYPE; n integer;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=(SELECT auth.uid()) AND lower(coalesce(status,'active'))='active';
 SELECT * INTO s FROM public.sites WHERE id=p_site;
 IF e.id IS NULL OR s.id IS NULL OR NOT public.is_site_in_my_authorized_scope(p_site::text,s.country)
 OR p_float IS NULL OR p_float<0 OR p_float>10000000 OR p_float::text IN ('NaN','Infinity','-Infinity')
 OR p_counter IS NULL OR p_counter !~ '^Counter [1-9][0-9]*$'
 THEN RAISE EXCEPTION 'Invalid or unauthorized counter opening' USING ERRCODE='42501'; END IF;
 n:=substring(p_counter FROM '[0-9]+$')::integer;
 IF n>coalesce(s.terminal_count,0) THEN RAISE EXCEPTION 'Counter is not configured for this site'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('open-counter-request:'||p_request::text,0));
 SELECT * INTO r FROM public.shifts WHERE id=p_request;
 IF FOUND THEN
 IF r.cashier_id<>e.id OR r.site_id<>p_site THEN RAISE EXCEPTION 'Opening identifier already used'; END IF;
 RETURN to_jsonb(r); END IF;
 -- A cashier cannot own simultaneous drawers even at different sites.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cashier-open:'||e.id::text,0));
 IF EXISTS(SELECT 1 FROM public.shifts WHERE cashier_id=e.id AND status='Open') THEN RAISE EXCEPTION 'SHIFT_CASHIER_ALREADY_OPEN'; END IF;
 INSERT INTO public.shifts(id,site_id,country_code,cashier_id,cashier_name,cashier_code,counter_number,
 start_time,opening_float,expected_cash,cash_sales,actual_cash,variance,status,reconciliation_status,ledger_version)
 VALUES(p_request,p_site,s.country,e.id,e.name,e.code,p_counter,clock_timestamp(),round(p_float,2),round(p_float,2),0,0,0,'Open','Pending',1)
 RETURNING * INTO r;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(r.id,r.site_id,r.country_code,e.id,'OPENED',jsonb_build_object('openingFloat',r.opening_float,'counter',r.counter_number));
 RETURN to_jsonb(r);
END $$;
