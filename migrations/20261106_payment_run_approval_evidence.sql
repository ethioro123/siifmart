CREATE OR REPLACE FUNCTION private.create_payment_run_atomic(p_ids uuid[],p_country text,p_currency text,p_channel text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.vendor_invoices%ROWTYPE; run public.payment_runs%ROWTYPE; total numeric:=0; n integer:=0; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL OR NOT public.is_country_in_my_authorized_scope(p_country) OR public.normalize_role(actor.role) NOT IN('group_ceo','country_managing_director','country_finance_director','cfo') OR p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 500 OR cardinality(p_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_ids)x)
 OR (p_country,p_currency) NOT IN(('ET','ETB'),('KE','KES')) THEN RAISE EXCEPTION 'Valid country-scoped invoice selection required'; END IF;
 FOR inv IN SELECT * FROM public.vendor_invoices WHERE id=ANY(p_ids) ORDER BY id FOR UPDATE LOOP
  PERFORM 1 FROM public.purchase_orders WHERE id=inv.po_id FOR UPDATE;
  IF NOT private.finance_site_scope(inv.site_id,inv.country_code) OR inv.country_code IS DISTINCT FROM p_country OR inv.currency IS DISTINCT FROM p_currency OR inv.status NOT IN('Approved','Partially_Paid')
  OR inv.approved_by_id IS NULL OR inv.created_by_id IS NULL OR inv.approved_by_id=inv.created_by_id
  OR (private.invoice_match(inv.id)<>'Matched' AND NOT(inv.match_status='Manual_Override' AND length(btrim(coalesce(inv.override_reason,'')))>=10))
  OR inv.payment_run_id IS NOT NULL OR inv.total_amount<=inv.amount_paid THEN RAISE EXCEPTION 'Eligible invoices must share the run country and currency and be unassigned'; END IF;
  n:=n+1;total:=total+inv.total_amount-inv.amount_paid;
 END LOOP;
 IF n<>cardinality(p_ids) THEN RAISE EXCEPTION 'One or more invoices unavailable'; END IF;
 INSERT INTO public.payment_runs(run_number,country_code,currency,total_invoices,total_amount,status,created_by_id,created_by_name,payment_channel)
 VALUES('PR-'||p_country||'-'||gen_random_uuid()::text,p_country,p_currency,n,total,'Pending_Approval',actor.id,actor.name,p_channel) RETURNING * INTO run;
 UPDATE public.vendor_invoices SET payment_run_id=run.id WHERE id=ANY(p_ids);
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>cardinality(p_ids) THEN RAISE EXCEPTION 'Invoice association incomplete'; END IF;
 RETURN to_jsonb(run);
END $$;

CREATE FUNCTION private.guard_payment_run_document() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF (NEW.country_code,NEW.currency,NEW.total_amount,NEW.total_invoices,NEW.created_by_id,NEW.run_number)
 IS DISTINCT FROM (OLD.country_code,OLD.currency,OLD.total_amount,OLD.total_invoices,OLD.created_by_id,OLD.run_number) THEN
 RAISE EXCEPTION 'Payment run membership and totals are immutable'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_payment_run_document() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_payment_run_document BEFORE UPDATE ON public.payment_runs FOR EACH ROW EXECUTE FUNCTION private.guard_payment_run_document();
