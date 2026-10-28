BEGIN;
ALTER TABLE public.product_price_history ADD COLUMN request_id uuid,ADD COLUMN currency text,ADD COLUMN reason text,
 ADD COLUMN requester_name text,ADD COLUMN finance_approver_name text;
CREATE INDEX product_price_history_product_retained ON public.product_price_history(site_id,product_id,changed_at DESC);
CREATE INDEX product_price_history_request_idx ON public.product_price_history(request_id) WHERE request_id IS NOT NULL;
CREATE TABLE private.product_price_evidence (
 history_id uuid PRIMARY KEY REFERENCES public.product_price_history(id) ON DELETE CASCADE,
 evidence jsonb NOT NULL
);
ALTER TABLE private.product_price_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.product_price_evidence FROM PUBLIC,anon,authenticated;
CREATE TABLE public.product_price_retention_holds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),product_id uuid NOT NULL,site_id uuid NOT NULL,country_code text NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1200),placed_by uuid NOT NULL,placed_at timestamptz NOT NULL DEFAULT now(),
 released_by uuid,released_at timestamptz,release_reason text,
 CHECK((released_by IS NULL AND released_at IS NULL AND release_reason IS NULL) OR (released_by IS NOT NULL AND released_at IS NOT NULL AND length(btrim(release_reason)) BETWEEN 3 AND 1200))
);
CREATE UNIQUE INDEX product_price_active_hold ON public.product_price_retention_holds(product_id,country_code) WHERE released_at IS NULL;
ALTER TABLE public.product_price_retention_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_price_retention_holds FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.product_price_retention_holds TO authenticated;
CREATE FUNCTION private.can_manage_price_retention(country text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id WHERE e.id=auth.uid()
 AND lower(coalesce(e.status,'active'))='active' AND ((e.role='group_ceo' AND public.is_country_in_my_authorized_scope(country))
 OR (e.role IN ('country_managing_director','country_commercial_director','country_finance_director','country_compliance_manager') AND upper(home.country)=upper(country))));
$$;
REVOKE ALL ON FUNCTION private.can_manage_price_retention(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_manage_price_retention(text) TO authenticated;
CREATE POLICY product_price_holds_read ON public.product_price_retention_holds FOR SELECT TO authenticated
 USING(private.can_manage_price_retention(country_code));
CREATE FUNCTION private.manage_product_price_hold(p_product_id uuid,p_country_code text,p_reason text,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target public.products%ROWTYPE; hold public.product_price_retention_holds%ROWTYPE; target_site uuid;
BEGIN
 IF NOT private.can_manage_price_retention(p_country_code) OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 THEN RAISE EXCEPTION 'Country authority and a meaningful hold/release reason are required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('price-retention:'||upper(p_country_code)||':'||p_product_id::text,0));
 SELECT * INTO hold FROM public.product_price_retention_holds h WHERE h.product_id=p_product_id AND h.country_code=upper(p_country_code) AND h.released_at IS NULL FOR UPDATE;
 IF p_release THEN
  IF hold.id IS NULL THEN RAISE EXCEPTION 'No active product price retention hold'; END IF;
  UPDATE public.product_price_retention_holds SET released_by=auth.uid(),released_at=now(),release_reason=btrim(p_reason) WHERE id=hold.id RETURNING * INTO hold;
 ELSE
  SELECT p.* INTO target FROM public.products p JOIN public.sites s ON s.id=p.site_id WHERE p.id=p_product_id AND upper(s.country)=upper(p_country_code);
  target_site:=target.site_id;
  IF target_site IS NULL THEN SELECT h.site_id INTO target_site FROM public.product_price_history h WHERE h.product_id=p_product_id AND h.country_code=upper(p_country_code) ORDER BY h.changed_at DESC LIMIT 1; END IF;
  IF target_site IS NULL THEN RAISE EXCEPTION 'Product or retained history is outside the requested country'; END IF;
  IF hold.id IS NOT NULL THEN RAISE EXCEPTION 'This product already has an active retention hold'; END IF;
  INSERT INTO public.product_price_retention_holds(product_id,site_id,country_code,reason,placed_by)
  VALUES(p_product_id,target_site,upper(p_country_code),btrim(p_reason),auth.uid()) RETURNING * INTO hold;
 END IF;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 SELECT CASE WHEN p_release THEN 'PRICE_RETENTION_HOLD_RELEASED' ELSE 'PRICE_RETENTION_HOLD_PLACED' END,'Merchandising',e.name,e.id,hold.site_id,hold.country_code,'product',p_product_id::text,
 jsonb_build_object('holdId',hold.id,'reason',btrim(p_reason)) FROM public.employees e WHERE e.id=auth.uid();
 RETURN jsonb_build_object('id',hold.id,'active',hold.released_at IS NULL);
END;
$$;
REVOKE ALL ON FUNCTION private.manage_product_price_hold(uuid,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.manage_product_price_hold(uuid,text,text,boolean) TO authenticated;
CREATE FUNCTION public.manage_product_price_hold(p_product_id uuid,p_country_code text,p_reason text,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.manage_product_price_hold(p_product_id,p_country_code,p_reason,p_release); $$;
REVOKE ALL ON FUNCTION public.manage_product_price_hold(uuid,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_product_price_hold(uuid,text,text,boolean) TO authenticated;
CREATE FUNCTION public.get_product_price_hold(p_product_id uuid,p_country_code text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT private.can_manage_price_retention(p_country_code) THEN RETURN jsonb_build_object('canManage',false,'hold',null); END IF;
 SELECT to_jsonb(h) INTO result FROM public.product_price_retention_holds h WHERE h.product_id=p_product_id AND h.country_code=upper(p_country_code) AND h.released_at IS NULL;
 RETURN jsonb_build_object('canManage',true,'hold',result);
END;
$$;
REVOKE ALL ON FUNCTION public.get_product_price_hold(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_product_price_hold(uuid,text) TO authenticated;
-- Maintenance triggers recheck the hold after taking the same product lock as placement/release.
CREATE FUNCTION private.guard_product_price_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE product uuid; country text; expires timestamptz; held boolean;
BEGIN
 IF TG_TABLE_NAME='product_price_history' THEN
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Applied price history is immutable'; END IF;
  product:=OLD.product_id; country:=OLD.country_code; expires:=OLD.changed_at+interval '10 years';
 ELSE
  IF NOT private.is_price_change(OLD.proposed_changes) OR OLD.change_type<>'edit' THEN RETURN OLD; END IF;
  product:=OLD.product_id::uuid;country:=OLD.country_code;
  IF OLD.status='approved' THEN expires:=greatest(OLD.approved_at,OLD.requested_at)+interval '10 years';
  ELSIF OLD.status='rejected' THEN expires:=greatest(OLD.rejected_at,OLD.requested_at)+interval '2 years';
  ELSE RAISE EXCEPTION 'Pending price proposals cannot be removed by retention'; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('price-retention:'||upper(country)||':'||product::text,0));
 SELECT EXISTS(SELECT 1 FROM public.product_price_retention_holds h WHERE h.product_id=product AND h.country_code=upper(country) AND h.released_at IS NULL) INTO held;
 IF held OR expires IS NULL OR expires>=statement_timestamp() THEN RAISE EXCEPTION 'Price record is within retention or protected by an audit/dispute hold'; END IF;
 IF TG_TABLE_NAME='inventory_requests' AND EXISTS(SELECT 1 FROM public.product_price_history h WHERE h.request_id=OLD.id) THEN RAISE EXCEPTION 'Retained price history still requires its approval evidence'; END IF;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_product_price_retention() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_applied_price_retention BEFORE UPDATE OR DELETE ON public.product_price_history FOR EACH ROW EXECUTE FUNCTION private.guard_product_price_retention();
CREATE TRIGGER protect_price_proposal_retention BEFORE DELETE ON public.inventory_requests FOR EACH ROW EXECUTE FUNCTION private.guard_product_price_retention();
CREATE TABLE private.price_retention_runs(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,country_code text NOT NULL,run_at timestamptz NOT NULL DEFAULT now(),history_deleted integer NOT NULL,requests_deleted integer NOT NULL);
ALTER TABLE private.price_retention_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.price_retention_runs FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.prune_product_price_history(p_country_code text,p_limit integer DEFAULT 250) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE history_count integer:=0; request_count integer:=0; target record;
BEGIN
 IF p_country_code IS NULL OR p_country_code!~'^[A-Z]{2}$' THEN RAISE EXCEPTION 'A specific country is required for retention'; END IF;
 -- SKIP LOCKED keeps maintenance from blocking live approvals; per-row guards recheck age/holds.
 FOR target IN SELECT h.id FROM public.product_price_history h WHERE h.country_code=p_country_code AND h.changed_at<statement_timestamp()-interval '10 years'
 AND NOT EXISTS(SELECT 1 FROM public.product_price_retention_holds hold WHERE hold.product_id=h.product_id AND hold.country_code=h.country_code AND hold.released_at IS NULL)
 ORDER BY h.changed_at,h.id LIMIT greatest(1,least(coalesce(p_limit,250),1000)) FOR UPDATE OF h SKIP LOCKED LOOP
  BEGIN DELETE FROM public.product_price_history WHERE id=target.id; history_count:=history_count+1; EXCEPTION WHEN raise_exception THEN NULL; END;
 END LOOP;
 FOR target IN SELECT r.id FROM public.inventory_requests r WHERE upper(r.country_code)=p_country_code AND r.change_type='edit' AND private.is_price_change(r.proposed_changes)
 AND ((r.status='approved' AND greatest(r.approved_at,r.requested_at)<statement_timestamp()-interval '10 years') OR (r.status='rejected' AND greatest(r.rejected_at,r.requested_at)<statement_timestamp()-interval '2 years'))
 AND NOT EXISTS(SELECT 1 FROM public.product_price_retention_holds hold WHERE hold.product_id::text=r.product_id AND hold.country_code=p_country_code AND hold.released_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.product_price_history h WHERE h.request_id=r.id)
 ORDER BY r.requested_at,r.id LIMIT greatest(1,least(coalesce(p_limit,250),1000)) FOR UPDATE OF r SKIP LOCKED LOOP
  BEGIN DELETE FROM public.inventory_requests WHERE id=target.id; request_count:=request_count+1; EXCEPTION WHEN raise_exception THEN NULL; END;
 END LOOP;
 INSERT INTO private.price_retention_runs(country_code,history_deleted,requests_deleted) VALUES(p_country_code,history_count,request_count);
 RETURN jsonb_build_object('country',p_country_code,'historyDeleted',history_count,'requestsDeleted',request_count);
END;
$$;
REVOKE ALL ON FUNCTION private.prune_product_price_history(text,integer) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.run_product_price_retention() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE country text;
BEGIN
 FOR country IN SELECT country_code FROM public.product_price_history UNION SELECT upper(country_code) FROM public.inventory_requests WHERE change_type='edit' LOOP
  PERFORM private.prune_product_price_history(country,250);
 END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION private.run_product_price_retention() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.record_product_effective_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    request public.inventory_requests%ROWTYPE; history_id uuid; target_currency text;
    v_old_effective numeric;
    v_new_effective numeric;
    v_country text;
    v_actor_name text;
BEGIN
    v_old_effective := CASE WHEN OLD.is_on_sale IS TRUE AND COALESCE(OLD.sale_price, 0) > 0 THEN OLD.sale_price ELSE OLD.price END;
    v_new_effective := CASE WHEN NEW.is_on_sale IS TRUE AND COALESCE(NEW.sale_price, 0) > 0 THEN NEW.sale_price ELSE NEW.price END;
    IF (OLD.price,OLD.cost_price,OLD.sale_price,OLD.is_on_sale) IS NOT DISTINCT FROM (NEW.price,NEW.cost_price,NEW.sale_price,NEW.is_on_sale) OR NEW.site_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT upper(s.country) INTO v_country FROM public.sites s WHERE s.id = NEW.site_id;
    IF v_country IS NULL THEN
        RAISE EXCEPTION 'Cannot record product price history without a valid site country';
    END IF;
    SELECT e.name INTO v_actor_name FROM public.employees e WHERE e.id = auth.uid() LIMIT 1;
    SELECT * INTO request FROM public.inventory_requests r WHERE r.id::text=nullif(current_setting('app.price_change_decision_id',true),'')
       OR r.id::text=nullif(current_setting('app.product_edit_decision_id',true),'') ORDER BY r.id LIMIT 1;
    SELECT coalesce(reg.default_currency,CASE v_country WHEN 'ET' THEN 'ETB' WHEN 'KE' THEN 'KES' END) INTO target_currency
    FROM public.sites site LEFT JOIN public.regions reg ON reg.code=site.region_code WHERE site.id=NEW.site_id;
    INSERT INTO public.product_price_history (
        product_id, site_id, country_code, product_name, sku,
        old_regular_price, new_regular_price, old_sale_price, new_sale_price,
        old_is_on_sale, new_is_on_sale, old_effective_price, new_effective_price,
        actor_id, actor_name, changed_at,request_id,currency,reason,requester_name,finance_approver_name
    ) VALUES (
        NEW.id, NEW.site_id, v_country, NEW.name, NEW.sku,
        OLD.price, NEW.price, OLD.sale_price, NEW.sale_price,
        COALESCE(OLD.is_on_sale, false), COALESCE(NEW.is_on_sale, false),
        v_old_effective, v_new_effective, auth.uid(),
        COALESCE(v_actor_name, auth.jwt() ->> 'email', 'System update'), now(),request.id,target_currency,request.adjustment_reason,request.requested_by,
        (SELECT name FROM public.employees WHERE id=request.finance_approved_by_employee_id)
    ) RETURNING id INTO history_id;
    INSERT INTO private.product_price_evidence(history_id,evidence) VALUES(history_id,jsonb_build_object(
      'requestId',request.id,'requesterId',request.requested_by_employee_id,'requester',request.requested_by,
      'approverId',auth.uid(),'approver',v_actor_name,'financeApproverId',request.finance_approved_by_employee_id,
      'financeClearedAt',request.finance_approved_at,'reason',request.adjustment_reason,'currency',target_currency,
      'oldCost',OLD.cost_price,'newCost',NEW.cost_price,
      'oldMarginPct',CASE WHEN v_old_effective>0 THEN round((v_old_effective-OLD.cost_price)*100/v_old_effective) END,
      'newMarginPct',CASE WHEN v_new_effective>0 THEN round((v_new_effective-NEW.cost_price)*100/v_new_effective) END,
      'pricingBaseline',request.price_review_context,'proposalBaseline',request.product_edit_baseline,'proposedChanges',request.proposed_changes,
      'effectiveAt',now()));
    RETURN NEW;
END;
$function$

;
DROP TRIGGER products_record_effective_price_change ON public.products;
CREATE TRIGGER products_record_effective_price_change AFTER UPDATE OF price,cost_price,sale_price,is_on_sale ON public.products FOR EACH ROW EXECUTE FUNCTION public.record_product_effective_price_change();
CREATE OR REPLACE FUNCTION public.list_product_price_history(p_site_id uuid,p_country_code text,p_product_id uuid,p_since timestamptz DEFAULT NULL,p_search text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 10)
RETURNS SETOF public.product_price_history LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT h.* FROM public.product_price_history h
 WHERE h.site_id=p_site_id AND h.country_code=upper(p_country_code) AND h.product_id=p_product_id
 AND (p_since IS NULL OR h.changed_at>=p_since)
 AND (nullif(btrim(p_search),'') IS NULL OR strpos(lower(concat_ws(' ',h.product_name,h.sku,h.actor_name,h.requester_name,h.finance_approver_name,h.reason,h.currency)),lower(btrim(left(p_search,200))))>0)
 ORDER BY h.changed_at DESC,h.id DESC OFFSET greatest(0,least(coalesce(p_offset,0),100000)) LIMIT greatest(1,least(coalesce(p_limit,10),50));
$$;
REVOKE ALL ON FUNCTION public.list_product_price_history(uuid,text,uuid,timestamptz,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_product_price_history(uuid,text,uuid,timestamptz,text,integer,integer) TO authenticated;
CREATE INDEX IF NOT EXISTS product_price_history_retention_scan ON public.product_price_history(country_code,changed_at,id);
CREATE INDEX IF NOT EXISTS price_proposal_retention_scan ON public.inventory_requests(country_code,status,requested_at,id) WHERE change_type='edit' AND private.is_price_change(proposed_changes);
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('product-price-retention','15 3 * * *','SELECT private.run_product_price_retention();');
COMMIT;
