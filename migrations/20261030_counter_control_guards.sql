-- Pending drops never alter the cash balance. Cancel them atomically on count submission.
CREATE FUNCTION public.guard_pending_counter_drops() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.count_submitted_at IS NOT NULL AND OLD.count_submitted_at IS NULL THEN
 UPDATE public.pos_cash_drops SET status='cancelled_at_close',updated_at=clock_timestamp()
 WHERE shift_id=NEW.id::text AND status='pending_supervisor';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_pending_counter_drops() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER counter_cancel_pending_drops BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.guard_pending_counter_drops();
-- Review reads must apply exact authorized site/country, irrespective of legacy drop policies.
CREATE OR REPLACE FUNCTION public.counter_review_queue(p_site uuid,p_country text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active'
 AND role IN ('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director'))
 OR NOT public.is_site_in_my_authorized_scope(p_site::text,p_country)
 OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=p_site AND upper(country)=upper(p_country))
 THEN RAISE EXCEPTION 'Supervisor queue denied' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('shifts',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (
 SELECT id,cashier_id,cashier_name,counter_number,variance,variance_flagged,ledger_version FROM public.shifts
 WHERE site_id=p_site AND country_code=p_country AND status='Closed' AND supervisor_id IS NULL
 AND count_submitted_at IS NOT NULL AND cashier_id<>auth.uid() ORDER BY end_time LIMIT 25) s),'[]'),
 'drops',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM (
 SELECT id,cashier_id,cashier_name,amount,currency,safe_bag_number FROM public.pos_cash_drops
 WHERE site_id=p_site::text AND country_code=p_country AND status='pending_supervisor' AND cashier_id<>auth.uid()::text
 ORDER BY created_at LIMIT 25) d),'[]'));
END $$;
REVOKE ALL ON FUNCTION public.counter_review_queue(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.counter_review_queue(uuid,text) TO authenticated;
