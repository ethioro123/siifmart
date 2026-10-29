-- Every counter mutation emits an event in its transaction. Enforce actor/country at that boundary.
CREATE FUNCTION private.guard_counter_actor_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.actor_id IS DISTINCT FROM auth.uid() OR NOT EXISTS(
 SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.id=NEW.actor_id AND lower(coalesce(e.status,'active'))='active'
 AND (e.role='group_ceo' OR upper(home.country)=upper(NEW.country_code)))
 THEN RAISE EXCEPTION 'Counter actor country boundary denied' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_counter_actor_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_counter_actor_event BEFORE INSERT ON public.pos_shift_events FOR EACH ROW EXECUTE FUNCTION private.guard_counter_actor_event();
CREATE OR REPLACE FUNCTION public.counter_shift_summary(p_shift uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.shifts%ROWTYPE; actor_role text;
BEGIN
 SELECT * INTO r FROM public.shifts WHERE id=p_shift;
 SELECT e.role INTO actor_role FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,'active'))='active' AND (e.role='group_ceo' OR upper(home.country)=upper(r.country_code));
 IF actor_role IS NULL OR r.id IS NULL OR NOT public.is_site_in_my_authorized_scope(r.site_id::text,r.country_code)
 OR (r.cashier_id<>auth.uid() AND actor_role NOT IN ('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director','country_finance_director','regional_finance_manager','group_cfo','group_ceo'))
 THEN RAISE EXCEPTION 'Counter access denied' USING ERRCODE='42501'; END IF;
 IF r.cashier_id=auth.uid() AND r.count_submitted_at IS NULL THEN
 RETURN jsonb_build_object('cash',0,'card',0,'mobile',0,'drops',0,'total',0,'expected',0,'blind',true);
 END IF;
 RETURN private.counter_totals(r.id)||jsonb_build_object('blind',false);
END $$;
