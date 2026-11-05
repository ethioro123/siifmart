-- Trusted invoice matching/dual control, atomic payment membership and complete AR aggregation.
CREATE FUNCTION private.invoice_match(p_invoice uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.vendor_invoices%ROWTYPE; po public.purchase_orders%ROWTYPE; l record; p public.po_items%ROWTYPE;
 matches integer; used numeric; has_lines boolean:=false; result text:='Matched';
BEGIN
 SELECT * INTO inv FROM public.vendor_invoices WHERE id=p_invoice;
 SELECT * INTO po FROM public.purchase_orders WHERE id=inv.po_id FOR UPDATE;
 IF po.id IS NULL OR po.site_id::text IS DISTINCT FROM inv.site_id OR po.country_code IS DISTINCT FROM inv.country_code
 OR po.currency IS DISTINCT FROM inv.currency OR po.status NOT IN('Received','Partially Received')
 OR (po.supplier_id IS NOT NULL AND po.supplier_id::text IS DISTINCT FROM inv.vendor_id) THEN RETURN 'Pending_Match'; END IF;
 FOR l IN SELECT sku,sum(invoiced_quantity) qty,max(invoiced_unit_price) price FROM public.invoice_items
 WHERE invoice_id=inv.id GROUP BY sku LOOP
  has_lines:=true;
  SELECT count(*) INTO matches FROM public.po_items WHERE po_id=po.id AND sku=l.sku;
  IF matches<>1 THEN RETURN 'Pending_Match'; END IF;
  SELECT * INTO p FROM public.po_items WHERE po_id=po.id AND sku=l.sku FOR UPDATE;
  SELECT coalesce(sum(i.invoiced_quantity),0) INTO used FROM public.invoice_items i JOIN public.vendor_invoices v ON v.id=i.invoice_id
   WHERE v.po_id=po.id AND v.id<>inv.id AND v.status IN('Approved','Partially_Paid','Paid') AND i.sku=l.sku;
  -- Invoice quantities/prices are commercial packs; received_qty is stored in sellable units.
  IF l.qty+used>least(p.quantity,coalesce(p.received_qty,0)/greatest(coalesce(p.pack_quantity,1),1)) THEN RETURN 'Discrepancy_Quantity'; END IF;
  IF l.price>p.unit_cost+0.01 THEN result:='Discrepancy_Price'; END IF;
 END LOOP;
 RETURN CASE WHEN has_lines THEN result ELSE 'Pending_Match' END;
END $$;
REVOKE ALL ON FUNCTION private.invoice_match(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.guard_vendor_invoice_integrity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; matched text; line_subtotal numeric; line_tax numeric;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL OR NOT private.finance_site_scope(NEW.site_id,NEW.country_code) THEN RAISE EXCEPTION 'Invoice authority required' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.status NOT IN('Draft','Pending_Approval') OR NEW.approved_by_id IS NOT NULL OR NEW.approved_at IS NOT NULL
   OR NEW.payment_run_id IS NOT NULL OR coalesce(NEW.amount_paid,0)<>0 THEN RAISE EXCEPTION 'Create an unapproved invoice first'; END IF;
  NEW.created_by_id:=actor.id; NEW.match_status:='Pending_Match'; NEW.override_reason:=NULL;
 ELSE
  IF (NEW.created_by_id,NEW.po_id,NEW.site_id,NEW.country_code,NEW.currency,NEW.vendor_id) IS DISTINCT FROM
   (OLD.created_by_id,OLD.po_id,OLD.site_id,OLD.country_code,OLD.currency,OLD.vendor_id) THEN RAISE EXCEPTION 'Invoice origin is immutable'; END IF;
  IF OLD.status IN('Approved','Partially_Paid','Paid') AND
   (to_jsonb(NEW)-ARRAY['updated_at','payment_run_id','amount_paid','status']) IS DISTINCT FROM
   (to_jsonb(OLD)-ARRAY['updated_at','payment_run_id','amount_paid','status']) THEN RAISE EXCEPTION 'Approved invoice is immutable'; END IF;
  IF OLD.status IN('Approved','Partially_Paid','Paid') AND NEW.status NOT IN('Approved','Partially_Paid','Paid') THEN RAISE EXCEPTION 'Approved invoices cannot return to draft'; END IF;
  IF OLD.status NOT IN('Approved','Partially_Paid','Paid') AND NEW.status IN('Partially_Paid','Paid') THEN RAISE EXCEPTION 'Independent approval required before settlement'; END IF;
  SELECT coalesce(sum(invoiced_quantity*invoiced_unit_price),0),coalesce(sum(invoiced_quantity*invoiced_unit_price*tax_rate/100),0)
   INTO line_subtotal,line_tax FROM public.invoice_items WHERE invoice_id=NEW.id;
  IF OLD.status NOT IN('Approved','Partially_Paid','Paid') THEN NEW.subtotal:=line_subtotal;NEW.tax_amount:=line_tax;NEW.total_amount:=line_subtotal+line_tax; END IF;
  matched:=private.invoice_match(NEW.id);
  IF NEW.status='Approved' AND OLD.status NOT IN('Approved','Partially_Paid','Paid') THEN
   IF actor.id=OLD.created_by_id OR public.normalize_role(actor.role) NOT IN('group_ceo','country_managing_director','country_finance_director','cfo','regional_finance_manager') THEN
    RAISE EXCEPTION 'Independent finance approver required' USING ERRCODE='42501'; END IF;
   IF matched<>'Matched' AND NOT (NEW.match_status='Manual_Override' AND length(btrim(coalesce(NEW.override_reason,'')))>=10) THEN
    RAISE EXCEPTION 'Trusted PO and receipt match or justified independent override required'; END IF;
   NEW.approved_by_id:=actor.id;NEW.approved_at:=now();
   NEW.match_status:=CASE WHEN matched='Matched' THEN matched ELSE 'Manual_Override' END;
  ELSIF OLD.status NOT IN('Approved','Partially_Paid','Paid') THEN
   NEW.match_status:=matched;NEW.approved_by_id:=NULL;NEW.approved_at:=NULL;NEW.override_reason:=NULL;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_vendor_invoice_integrity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_vendor_invoice_integrity BEFORE INSERT OR UPDATE ON public.vendor_invoices FOR EACH ROW EXECUTE FUNCTION private.guard_vendor_invoice_integrity();

CREATE FUNCTION private.guard_invoice_line_integrity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.vendor_invoices%ROWTYPE; line public.invoice_items%ROWTYPE; p public.po_items%ROWTYPE;
BEGIN
 IF auth.role()='service_role' THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN line:=OLD; ELSE line:=NEW; END IF;
 SELECT * INTO inv FROM public.vendor_invoices WHERE id=line.invoice_id FOR UPDATE;
 IF inv.id IS NULL OR inv.status NOT IN('Draft','Pending_Approval') OR NOT private.finance_site_scope(inv.site_id,inv.country_code)
 OR public.normalize_role(public.get_my_role()) NOT IN('group_ceo','country_managing_director','country_finance_director','cfo','regional_finance_manager','accountant','treasury_officer','country_commercial_director','vendor_relations_manager') THEN
 RAISE EXCEPTION 'Editable scoped invoice required' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' AND NEW.invoice_id IS DISTINCT FROM OLD.invoice_id THEN RAISE EXCEPTION 'Invoice line cannot move'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.invoiced_quantity IS NULL OR NEW.invoiced_quantity<=0 OR NEW.invoiced_unit_price IS NULL OR NEW.invoiced_unit_price<0
 OR NEW.invoiced_quantity::text IN('NaN','Infinity','-Infinity') OR NEW.invoiced_unit_price::text IN('NaN','Infinity','-Infinity')
 OR NEW.tax_rate IS NULL OR NEW.tax_rate<0 OR NEW.tax_rate>100 THEN RAISE EXCEPTION 'Invalid invoice quantities or price'; END IF;
 SELECT * INTO p FROM public.po_items WHERE po_id=inv.po_id AND sku=NEW.sku ORDER BY id LIMIT 1;
 NEW.po_quantity:=p.quantity;NEW.received_quantity:=coalesce(p.received_qty,0)/greatest(coalesce(p.pack_quantity,1),1);NEW.po_unit_price:=p.unit_cost;
 NEW.total_price:=NEW.invoiced_quantity*NEW.invoiced_unit_price;
 NEW.match_variance_pct:=CASE WHEN p.unit_cost>0 THEN (NEW.invoiced_unit_price-p.unit_cost)/p.unit_cost*100 ELSE 0 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_invoice_line_integrity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_invoice_line_integrity BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION private.guard_invoice_line_integrity();

CREATE FUNCTION public.create_vendor_invoice_atomic(p_header jsonb,p_items jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE inv public.vendor_invoices%ROWTYPE; l jsonb; subtotal numeric; tax numeric;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Authenticated invoice with lines required'; END IF;
 SELECT sum((x->>'invoiced_quantity')::numeric*(x->>'invoiced_unit_price')::numeric),
 sum((x->>'invoiced_quantity')::numeric*(x->>'invoiced_unit_price')::numeric*coalesce((x->>'tax_rate')::numeric,0)/100)
 INTO subtotal,tax FROM jsonb_array_elements(p_items)x;
 INSERT INTO public.vendor_invoices(invoice_number,vendor_id,vendor_name,po_id,po_number,site_id,country_code,invoice_date,due_date,subtotal,tax_amount,total_amount,currency,status,created_by_id)
 VALUES(p_header->>'invoice_number',p_header->>'vendor_id',p_header->>'vendor_name',(p_header->>'po_id')::uuid,p_header->>'po_number',p_header->>'site_id',p_header->>'country_code',
 coalesce((p_header->>'invoice_date')::date,current_date),(p_header->>'due_date')::date,subtotal,tax,subtotal+tax,p_header->>'currency','Draft',auth.uid()) RETURNING * INTO inv;
 FOR l IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  INSERT INTO public.invoice_items(invoice_id,product_id,sku,item_name,invoiced_quantity,invoiced_unit_price,tax_rate)
  VALUES(inv.id,l->>'product_id',l->>'sku',l->>'item_name',(l->>'invoiced_quantity')::numeric,(l->>'invoiced_unit_price')::numeric,coalesce((l->>'tax_rate')::numeric,0));
 END LOOP;
 UPDATE public.vendor_invoices SET status='Pending_Approval' WHERE id=inv.id RETURNING * INTO inv;
 RETURN jsonb_build_object('invoice',to_jsonb(inv),'items',(SELECT jsonb_agg(to_jsonb(i)) FROM public.invoice_items i WHERE invoice_id=inv.id));
END $$;
REVOKE ALL ON FUNCTION public.create_vendor_invoice_atomic(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_vendor_invoice_atomic(jsonb,jsonb) TO authenticated;

CREATE FUNCTION private.create_payment_run_atomic(p_ids uuid[],p_country text,p_currency text,p_channel text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE inv public.vendor_invoices%ROWTYPE; run public.payment_runs%ROWTYPE; total numeric:=0; n integer:=0; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL OR NOT public.is_country_in_my_authorized_scope(p_country) OR public.normalize_role(actor.role) NOT IN('group_ceo','country_managing_director','country_finance_director','cfo') OR p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 500 OR cardinality(p_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_ids)x)
 OR (p_country,p_currency) NOT IN(('ET','ETB'),('KE','KES')) THEN RAISE EXCEPTION 'Valid country-scoped invoice selection required'; END IF;
 FOR inv IN SELECT * FROM public.vendor_invoices WHERE id=ANY(p_ids) ORDER BY id FOR UPDATE LOOP
  IF NOT private.finance_site_scope(inv.site_id,inv.country_code) OR inv.country_code IS DISTINCT FROM p_country OR inv.currency IS DISTINCT FROM p_currency OR inv.status NOT IN('Approved','Partially_Paid')
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
REVOKE ALL ON FUNCTION private.create_payment_run_atomic(uuid[],text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.create_payment_run_atomic(uuid[],text,text,text) TO authenticated;
CREATE FUNCTION public.create_payment_run_atomic(p_ids uuid[],p_country text,p_currency text,p_channel text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.create_payment_run_atomic(p_ids,p_country,p_currency,p_channel); $$;
REVOKE ALL ON FUNCTION public.create_payment_run_atomic(uuid[],text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_payment_run_atomic(uuid[],text,text,text) TO authenticated;
REVOKE INSERT ON public.payment_runs FROM authenticated;

CREATE FUNCTION private.guard_payment_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE run public.payment_runs%ROWTYPE;
BEGIN
 IF NEW.payment_run_id IS NOT NULL THEN
  SELECT * INTO run FROM public.payment_runs WHERE id=NEW.payment_run_id FOR SHARE;
  IF run.country_code IS DISTINCT FROM NEW.country_code OR run.currency IS DISTINCT FROM NEW.currency OR NEW.status NOT IN('Approved','Partially_Paid','Paid') THEN
   RAISE EXCEPTION 'Invoice and payment run must share country and currency and have approval'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_payment_membership() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_payment_membership BEFORE INSERT OR UPDATE ON public.vendor_invoices FOR EACH ROW EXECUTE FUNCTION private.guard_payment_membership();

CREATE FUNCTION public.ar_aging_totals(p_country text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('current',coalesce(sum(b) FILTER(WHERE days<=0),0),'days31to60',coalesce(sum(b) FILTER(WHERE days BETWEEN 1 AND 30),0),
 'days61to90',coalesce(sum(b) FILTER(WHERE days BETWEEN 31 AND 60),0),'days90Plus',coalesce(sum(b) FILTER(WHERE days>60),0),'totalOutstanding',coalesce(sum(b),0))
 FROM (SELECT greatest(coalesce(balance_due,total_amount-amount_paid),0) b,current_date-coalesce(due_date,current_date) days FROM public.ar_invoices
 WHERE country_code=p_country AND status NOT IN('Paid','Voided')) s;
$$;
REVOKE ALL ON FUNCTION public.ar_aging_totals(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ar_aging_totals(text) TO authenticated;
