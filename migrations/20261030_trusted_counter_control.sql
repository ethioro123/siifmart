-- Counter ownership already uses enforce_open_shift_assignment advisory locks.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cashier_id uuid REFERENCES public.employees(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS count_submitted_at timestamptz;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS ledger_version integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS sales_shift_id_idx ON public.sales(shift_id);
CREATE TABLE public.pos_shift_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),shift_id uuid NOT NULL REFERENCES public.shifts(id),
 site_id uuid NOT NULL REFERENCES public.sites(id),country_code text NOT NULL,
 actor_id uuid NOT NULL REFERENCES public.employees(id),action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_shift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY shift_events_read ON public.pos_shift_events FOR SELECT TO authenticated
 USING(public.is_site_in_my_authorized_scope(site_id::text,country_code));
REVOKE ALL ON public.pos_shift_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pos_shift_events TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.shifts FROM authenticated,anon;
REVOKE INSERT,UPDATE,DELETE ON public.pos_cash_drops FROM authenticated,anon;

CREATE FUNCTION public.open_counter_shift(p_site uuid,p_counter text,p_float numeric,p_request uuid)
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
 start_time,opening_float,expected_cash,status,reconciliation_status,ledger_version)
 VALUES(p_request,p_site,s.country,e.id,e.name,e.code,p_counter,clock_timestamp(),round(p_float,2),round(p_float,2),'Open','Pending',1)
 RETURNING * INTO r;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(r.id,r.site_id,r.country_code,e.id,'OPENED',jsonb_build_object('openingFloat',r.opening_float,'counter',r.counter_number));
 RETURN to_jsonb(r);
END $$;

CREATE FUNCTION public.stamp_counter_sale() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.shifts%ROWTYPE;
BEGIN
 IF TG_OP='UPDATE' THEN
 IF ROW(NEW.shift_id,NEW.cashier_id) IS DISTINCT FROM ROW(OLD.shift_id,OLD.cashier_id) THEN RAISE EXCEPTION 'Sale counter attribution is immutable'; END IF;
 -- Refund changes require a separate cash-refund record; historical status alone is not a cash movement.
 RETURN NEW;
 END IF;
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO r FROM public.shifts WHERE cashier_id=auth.uid() AND site_id=NEW.site_id AND status='Open' FOR UPDATE;
 IF NOT FOUND THEN
 IF NEW.fulfillment_status='Delivered' THEN RAISE EXCEPTION 'Open your assigned counter before recording a POS sale'; END IF;
 NEW.shift_id:=NULL; NEW.cashier_id:=auth.uid(); RETURN NEW;
 END IF;
 IF r.country_code IS DISTINCT FROM NEW.country_code THEN RAISE EXCEPTION 'Counter country mismatch'; END IF;
 NEW.shift_id:=r.id; NEW.cashier_id:=r.cashier_id; NEW.cashier_name:=r.cashier_name;
 RETURN NEW;
END $$;
CREATE TRIGGER sales_counter_attribution BEFORE INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.stamp_counter_sale();

CREATE FUNCTION private.counter_totals(p_shift uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH s AS (SELECT * FROM public.shifts WHERE id=p_shift), totals AS (
 SELECT coalesce(sum(total) FILTER(WHERE lower(payment_method)='cash' AND status='Completed'),0) cash,
 coalesce(sum(total) FILTER(WHERE lower(payment_method)='card' AND status='Completed'),0) card,
 coalesce(sum(total) FILTER(WHERE lower(payment_method) NOT IN ('cash','card') AND status='Completed'),0) mobile,
 count(*) FILTER(WHERE status IN ('Refunded','Partially Refunded')) unresolved_refunds
 FROM public.sales WHERE shift_id=p_shift
 ), drops AS (SELECT coalesce(sum(amount),0) amount,count(*) count FROM public.pos_cash_drops
 WHERE shift_id=p_shift::text AND status='deposited_in_safe')
 SELECT jsonb_build_object('cash',t.cash,'card',t.card,'mobile',t.mobile,'drops',d.amount,'dropCount',d.count,
 'expenses',coalesce(s.expenses,0),'total',t.cash+t.card+t.mobile,
 'expected',s.opening_float+t.cash-d.amount-coalesce(s.expenses,0),'unresolvedRefunds',t.unresolved_refunds)
 FROM s CROSS JOIN totals t CROSS JOIN drops d;
$$;
REVOKE ALL ON FUNCTION private.counter_totals(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.submit_counter_count(p_shift uuid,p_denominations jsonb,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.shifts%ROWTYPE; totals jsonb; actual numeric:=0; pair record; denom numeric; qty numeric;
BEGIN
 SELECT * INTO r FROM public.shifts WHERE id=p_shift FOR UPDATE;
 IF r.id IS NULL OR r.cashier_id IS DISTINCT FROM auth.uid() OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code)
 THEN RAISE EXCEPTION 'Only the assigned cashier can submit this count' USING ERRCODE='42501'; END IF;
 IF r.count_submitted_at IS NOT NULL THEN RETURN to_jsonb(r); END IF;
 IF r.status<>'Open' THEN RAISE EXCEPTION 'Counter is not open'; END IF;
 IF jsonb_typeof(p_denominations)<>'object' OR p_denominations IS NULL THEN RAISE EXCEPTION 'Denomination count required'; END IF;
 FOR pair IN SELECT * FROM jsonb_each_text(p_denominations) LOOP
 denom:=pair.key::numeric; qty:=pair.value::numeric;
 IF qty<0 OR qty<>trunc(qty) OR qty>100000 OR qty::text IN ('NaN','Infinity','-Infinity')
 OR NOT ((r.country_code='ET' AND denom=ANY(ARRAY[1,5,10,20,50,100,200]::numeric[]))
 OR (r.country_code='KE' AND denom=ANY(ARRAY[1,5,10,20,50,100,200,500,1000]::numeric[]))) THEN RAISE EXCEPTION 'Invalid denomination count'; END IF;
 actual:=actual+denom*qty;
 END LOOP;
 totals:=private.counter_totals(r.id);
 UPDATE public.shifts SET actual_cash=actual,expected_cash=(totals->>'expected')::numeric,
 variance=actual-(totals->>'expected')::numeric,cash_sales=(totals->>'cash')::numeric,
 card_sales=(totals->>'card')::numeric,mobile_sales=(totals->>'mobile')::numeric,
 cash_drops=(totals->>'drops')::numeric,drop_count=(totals->>'dropCount')::integer,
 denominations=p_denominations,discrepancy_reason=left(p_reason,2000),count_submitted_at=clock_timestamp(),
 end_time=clock_timestamp(),status='Closed',closed_by=r.cashier_name,reconciliation_status='Pending',
 variance_flagged=(actual<>(totals->>'expected')::numeric OR r.ledger_version=0 OR (totals->>'unresolvedRefunds')::integer>0)
 WHERE id=r.id RETURNING * INTO r;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(r.id,r.site_id,r.country_code,auth.uid(),'COUNT_SUBMITTED',jsonb_build_object('actual',r.actual_cash,'expected',r.expected_cash,'legacyLedger',r.ledger_version=0,'unresolvedRefunds',totals->'unresolvedRefunds'));
 RETURN to_jsonb(r);
END $$;

CREATE FUNCTION public.review_counter_shift(p_shift uuid,p_stage text,p_action text,p_notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; r public.shifts%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO r FROM public.shifts WHERE id=p_shift FOR UPDATE;
 IF e.id IS NULL OR r.id IS NULL OR r.cashier_id=e.id OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code)
 OR r.status NOT IN ('Closed','Flagged') OR r.count_submitted_at IS NULL
 THEN RAISE EXCEPTION 'Independent scoped reviewer required' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_notes,'')))<5 THEN RAISE EXCEPTION 'Review reason required'; END IF;
 IF p_stage='supervisor' AND e.role IN ('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director') THEN
 IF r.supervisor_id IS NOT NULL THEN RAISE EXCEPTION 'Supervisor review already recorded'; END IF;
 UPDATE public.shifts SET supervisor_id=e.id,supervisor_name=e.name,supervisor_role=e.role,
 supervisor_signed_at=clock_timestamp(),supervisor_co_sign_notes=left(p_notes,2000) WHERE id=r.id;
 ELSIF p_stage='finance' AND e.role IN ('country_finance_director','regional_finance_manager','group_cfo') THEN
 IF r.supervisor_id IS NULL OR r.supervisor_id=e.id THEN RAISE EXCEPTION 'Independent supervisor review must precede Finance'; END IF;
 IF p_action NOT IN ('Reconciled','Flagged') THEN RAISE EXCEPTION 'Invalid Finance decision'; END IF;
 IF p_action='Reconciled' AND (r.ledger_version=0 OR EXISTS(SELECT 1 FROM public.sales WHERE shift_id=r.id AND status IN ('Refunded','Partially Refunded')))
 THEN RAISE EXCEPTION 'Historical or refunded cash requires ledger reconciliation; keep this drawer flagged'; END IF;
 UPDATE public.shifts SET finance_sign_off_by=e.id,finance_sign_off_name=e.name,finance_sign_off_at=clock_timestamp(),
 hq_notes=left(p_notes,2000),reconciled_by=e.name,reconciled_at=clock_timestamp(),reconciliation_status=p_action,
 status=CASE WHEN p_action='Reconciled' THEN 'Audited' ELSE 'Flagged' END WHERE id=r.id;
 ELSE RAISE EXCEPTION 'Review role is not authorized' USING ERRCODE='42501'; END IF;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(r.id,r.site_id,r.country_code,e.id,upper(p_stage)||'_REVIEW',jsonb_build_object('decision',p_action,'notes',left(p_notes,2000)));
 SELECT * INTO r FROM public.shifts WHERE id=r.id; RETURN to_jsonb(r);
END $$;

CREATE FUNCTION public.counter_shift_summary(p_shift uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.shifts%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.shifts WHERE id=p_shift;
 IF auth.uid() IS NULL OR r.id IS NULL OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code) THEN RAISE EXCEPTION 'Counter access denied' USING ERRCODE='42501'; END IF;
 IF r.cashier_id=auth.uid() AND r.count_submitted_at IS NULL THEN
 RETURN jsonb_build_object('cash',0,'card',0,'mobile',0,'drops',0,'total',0,'expected',0,'blind',true);
 END IF;
 RETURN private.counter_totals(r.id)||jsonb_build_object('blind',false);
END $$;

CREATE FUNCTION public.request_counter_drop(p_shift uuid,p_amount numeric,p_bag text,p_reason text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.shifts%ROWTYPE; d public.pos_cash_drops%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.shifts WHERE id=p_shift FOR UPDATE;
 IF r.cashier_id IS DISTINCT FROM auth.uid() OR r.status<>'Open' OR r.id IS NULL OR p_amount IS NULL OR p_amount<=0 OR p_amount>10000000
 OR p_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid cash drop request' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM public.pos_cash_drops WHERE id=p_request;
 IF FOUND THEN IF d.cashier_id<>auth.uid()::text THEN RAISE EXCEPTION 'Request identifier already used'; END IF; RETURN to_jsonb(d); END IF;
 INSERT INTO public.pos_cash_drops(id,site_id,country_code,shift_id,drop_number,amount,currency,safe_bag_number,reason,cashier_id,cashier_name,status)
 VALUES(p_request,r.site_id::text,r.country_code,r.id::text,'DROP-'||p_request::text,round(p_amount,2),CASE WHEN r.country_code='KE' THEN 'KES' ELSE 'ETB' END,
 left(p_bag,100),left(p_reason,1000),r.cashier_id::text,r.cashier_name,'pending_supervisor') RETURNING * INTO d;
 RETURN to_jsonb(d);
END $$;
CREATE FUNCTION public.approve_counter_drop(p_drop uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; d public.pos_cash_drops%ROWTYPE; r public.shifts%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO d FROM public.pos_cash_drops WHERE id=p_drop;
 SELECT * INTO r FROM public.shifts WHERE id=d.shift_id::uuid FOR UPDATE;
 SELECT * INTO d FROM public.pos_cash_drops WHERE id=p_drop FOR UPDATE;
 IF e.id IS NULL OR d.id IS NULL OR d.cashier_id=e.id::text OR r.status<>'Open'
 OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code)
 OR e.role NOT IN ('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director')
 THEN RAISE EXCEPTION 'Independent supervisor required' USING ERRCODE='42501'; END IF;
 IF d.status='deposited_in_safe' THEN RETURN to_jsonb(d); END IF;
 IF d.status<>'pending_supervisor' THEN RAISE EXCEPTION 'Drop is not awaiting approval'; END IF;
 IF d.amount>(private.counter_totals(r.id)->>'expected')::numeric THEN RAISE EXCEPTION 'Drop exceeds recorded available cash'; END IF;
 UPDATE public.pos_cash_drops SET supervisor_id=e.id::text,supervisor_name=e.name,supervisor_role=e.role,status='deposited_in_safe',updated_at=clock_timestamp()
 WHERE id=d.id RETURNING * INTO d;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(r.id,r.site_id,r.country_code,e.id,'DROP_APPROVED',jsonb_build_object('drop',d.id,'amount',d.amount));
 RETURN to_jsonb(d);
END $$;
REVOKE ALL ON FUNCTION public.open_counter_shift(uuid,text,numeric,uuid),public.stamp_counter_sale(),public.submit_counter_count(uuid,jsonb,text),public.review_counter_shift(uuid,text,text,text),public.counter_shift_summary(uuid),public.request_counter_drop(uuid,numeric,text,text,uuid),public.approve_counter_drop(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.open_counter_shift(uuid,text,numeric,uuid),public.submit_counter_count(uuid,jsonb,text),public.review_counter_shift(uuid,text,text,text),public.counter_shift_summary(uuid),public.request_counter_drop(uuid,numeric,text,text,uuid),public.approve_counter_drop(uuid) TO authenticated;
