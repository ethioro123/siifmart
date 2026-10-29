CREATE OR REPLACE FUNCTION private.counter_totals(p_shift uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH s AS (SELECT * FROM public.shifts WHERE id=p_shift), totals AS (
 SELECT coalesce(sum(total) FILTER(WHERE lower(payment_method)='cash' AND status='Completed'),0) cash,
 coalesce(sum(total) FILTER(WHERE lower(payment_method)='card' AND status='Completed'),0) card,
 coalesce(sum(total) FILTER(WHERE lower(payment_method) NOT IN ('cash','card') AND status='Completed'),0) mobile,
 count(*) FILTER(WHERE status IN ('Refunded','Partially Refunded')) unresolved_refunds
 FROM public.sales WHERE shift_id=p_shift
 ), drops AS (SELECT coalesce(sum(amount),0) amount,count(*) count FROM public.pos_cash_drops
 WHERE shift_id=p_shift::text AND status IN ('deposited_in_safe','transferred_to_bank','audited','variance_flagged'))
 SELECT jsonb_build_object('cash',t.cash,'card',t.card,'mobile',t.mobile,'drops',d.amount,'dropCount',d.count,
 'expenses',coalesce(s.expenses,0),'total',t.cash+t.card+t.mobile,
 'expected',s.opening_float+t.cash-d.amount-coalesce(s.expenses,0),'unresolvedRefunds',t.unresolved_refunds)
 FROM s CROSS JOIN totals t CROSS JOIN drops d;
$$;
REVOKE ALL ON FUNCTION private.counter_totals(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.transfer_counter_safe_bags(p_drops uuid[],p_manifest text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; d public.pos_cash_drops%ROWTYPE; country text; transferred integer:=0;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 IF e.id IS NULL OR e.role NOT IN ('store_manager','country_finance_director','regional_finance_manager','country_operations_director','regional_operations_manager')
 OR coalesce(cardinality(p_drops),0) NOT BETWEEN 1 AND 100 OR length(btrim(coalesce(p_manifest,'')))<3
 THEN RAISE EXCEPTION 'Authorized custody actor and bank manifest required' USING ERRCODE='42501'; END IF;
 FOR d IN SELECT * FROM public.pos_cash_drops WHERE id=ANY(p_drops) ORDER BY id FOR UPDATE LOOP
 IF NOT public.is_site_in_my_authorized_scope(d.site_id,d.country_code) OR d.status<>'deposited_in_safe'
 THEN RAISE EXCEPTION 'Every bag must be confirmed in the actor scope'; END IF;
 IF country IS NOT NULL AND country<>d.country_code THEN RAISE EXCEPTION 'Cross-country manifests are prohibited'; END IF;
 country:=d.country_code;
 UPDATE public.pos_cash_drops SET status='transferred_to_bank',notes=left(p_manifest,2000),updated_at=clock_timestamp() WHERE id=d.id;
 INSERT INTO public.pos_shift_events(shift_id,site_id,country_code,actor_id,action,details)
 VALUES(d.shift_id::uuid,d.site_id::uuid,d.country_code,e.id,'BANK_TRANSFER',jsonb_build_object('drop',d.id,'manifest',left(p_manifest,2000)));
 transferred:=transferred+1;
 END LOOP;
 IF transferred<>(SELECT count(DISTINCT x) FROM unnest(p_drops) x) THEN RAISE EXCEPTION 'Manifest contains an unavailable bag'; END IF;
 RETURN transferred;
END $$;
REVOKE ALL ON FUNCTION public.transfer_counter_safe_bags(uuid[],text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transfer_counter_safe_bags(uuid[],text) TO authenticated;
