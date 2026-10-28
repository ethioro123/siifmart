CREATE OR REPLACE FUNCTION private.clear_price_change_finance(request_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 PERFORM id FROM public.products WHERE id::text=r.product_id AND site_id::text=r.site_id FOR UPDATE;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canFinance')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Country Finance Director clearance authority required') USING ERRCODE='42501'; END IF;
 INSERT INTO private.price_change_clearances(request_id,employee_id,pricing_baseline) VALUES(r.id,auth.uid(),route->'pricingBaseline')
 ON CONFLICT ON CONSTRAINT price_change_clearances_pkey DO UPDATE SET employee_id=excluded.employee_id,pricing_baseline=excluded.pricing_baseline,cleared_at=now();
 PERFORM set_config('app.merchandising_finance_signoff_id',r.id::text,true);
 UPDATE public.inventory_requests SET finance_approved_by_employee_id=auth.uid(),finance_approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.merchandising_finance_signoff_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 SELECT 'PRICE_FINANCE_CLEARED','Merchandising',e.name,e.id,r.site_id::uuid,r.country_code,'inventory_request',r.id::text,jsonb_build_object('role',e.role)
 FROM public.employees e WHERE e.id=auth.uid();
END;
$$;
