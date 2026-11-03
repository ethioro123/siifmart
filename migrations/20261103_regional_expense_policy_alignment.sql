-- Align expense routing and decisions to the configured country and region.
-- Also installs the authenticated decision RPC on staging, where it is absent.
BEGIN;

CREATE OR REPLACE FUNCTION private.set_expense_governance_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE facility public.sites%ROWTYPE; regional_limit numeric; country_limit numeric;
BEGIN
  SELECT * INTO facility FROM public.sites WHERE id = NEW.site_id;
  IF facility.id IS NULL OR upper(NEW.country_code) IS DISTINCT FROM upper(facility.country) THEN
    RAISE EXCEPTION 'Expense facility and country must match' USING ERRCODE = '23514';
  END IF;
  NEW.region_code := facility.region_code;
  SELECT COALESCE(r.autonomous_expense_limit, c.expense_regional_limit), c.expense_country_limit
    INTO regional_limit, country_limit
  FROM public.country_governance_limits c
  LEFT JOIN public.regions r ON r.code = facility.region_code AND upper(r.country) = upper(facility.country)
  WHERE upper(c.country_code) = upper(facility.country);
  IF regional_limit IS NULL OR country_limit IS NULL OR regional_limit < 0 OR country_limit < 0 THEN
    RAISE EXCEPTION 'Expense approval limits are not configured for this country' USING ERRCODE = '23514';
  END IF;
  NEW.requires_hq_approval := NEW.amount > regional_limit;
  NEW.escalated_to_ceo := NEW.amount > country_limit;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.set_expense_governance_scope() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS set_expense_governance_scope ON public.expenses;
CREATE TRIGGER set_expense_governance_scope
BEFORE INSERT OR UPDATE OF amount, site_id, country_code ON public.expenses
FOR EACH ROW EXECUTE FUNCTION private.set_expense_governance_scope();

CREATE OR REPLACE FUNCTION public.guard_expense_review()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE actor public.employees%ROWTYPE; actor_role text; regional_limit numeric; country_limit numeric;
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status NOT IN ('Approved','Rejected') THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active reviewer required'; END IF;
 actor_role := public.normalize_role(actor.role);
 IF actor_role NOT IN ('group_ceo','group_cfo','country_managing_director','country_finance_director','country_operations_director','regional_finance_manager','regional_operations_manager')
 OR NOT public.is_site_in_my_authorized_scope(OLD.site_id::text,OLD.country_code) THEN RAISE EXCEPTION 'Expense review denied'; END IF;
 IF OLD.status <> 'Pending' THEN RAISE EXCEPTION 'Expense is no longer pending'; END IF;
 IF OLD.created_by_id=actor.id OR lower(trim(OLD.created_by_name))=lower(trim(actor.name)) THEN RAISE EXCEPTION 'Independent reviewer required'; END IF;
 IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code
 OR NEW.created_by_id IS DISTINCT FROM OLD.created_by_id THEN RAISE EXCEPTION 'Expense evidence cannot change during review'; END IF;
 SELECT COALESCE(r.autonomous_expense_limit,c.expense_regional_limit),c.expense_country_limit
   INTO regional_limit,country_limit
 FROM public.country_governance_limits c
 LEFT JOIN public.regions r ON r.code=OLD.region_code AND upper(r.country)=upper(OLD.country_code)
 WHERE upper(c.country_code)=upper(OLD.country_code);
 IF regional_limit IS NULL OR country_limit IS NULL THEN RAISE EXCEPTION 'Expense limits are unavailable'; END IF;
 IF coalesce(OLD.escalated_to_ceo,false) OR OLD.amount>country_limit THEN
   IF actor_role NOT IN ('group_ceo','group_cfo') THEN RAISE EXCEPTION 'Group Finance or CEO required'; END IF;
 ELSIF actor_role IN ('regional_finance_manager','regional_operations_manager') THEN
   IF OLD.amount>regional_limit THEN RAISE EXCEPTION 'Country sign-off required'; END IF;
 END IF;
 IF coalesce(current_setting('siifmart.expense_review_reason',true),'')='' THEN RAISE EXCEPTION 'Use the expense decision function with a reason'; END IF;
 IF NEW.status='Approved' THEN NEW.approved_by_id:=actor.id; NEW.approved_by:=actor.name; NEW.approved_at:=now(); END IF;
 NEW.updated_at:=now();
 INSERT INTO public.system_logs(user_name,action,module,details,site_id,country_code)
 VALUES(actor.name,'EXPENSE_'||upper(NEW.status),'Financials',jsonb_build_object('expense_id',OLD.id,'amount',OLD.amount,'reason',current_setting('siifmart.expense_review_reason',true))::text,OLD.site_id,OLD.country_code);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_expense_review() FROM PUBLIC;
DROP TRIGGER IF EXISTS expense_review_guard ON public.expenses;
CREATE TRIGGER expense_review_guard BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.guard_expense_review();
CREATE OR REPLACE FUNCTION public.decide_expense(p_expense_id uuid,p_decision text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result public.expenses%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR p_decision NOT IN ('Approved','Rejected') OR nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Signed-in review and decision reason required'; END IF;
 PERFORM set_config('siifmart.expense_review_reason',trim(p_reason),true);
 UPDATE public.expenses SET status=p_decision WHERE id=p_expense_id AND status='Pending' RETURNING * INTO result;
 IF NOT FOUND THEN RAISE EXCEPTION 'Expense is unavailable or no longer pending'; END IF;
 PERFORM set_config('siifmart.expense_review_reason','',true);
 RETURN jsonb_build_object('success',true,'expense_id',result.id,'status',result.status);
END; $$;
REVOKE ALL ON FUNCTION public.decide_expense(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_expense(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.approve_expense(p_expense_id uuid,p_approver_id text,p_approver_name text,p_approver_role text,p_notes text DEFAULT '')
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT public.decide_expense(p_expense_id,'Approved',coalesce(nullif(trim(p_notes),''),'Expense approval'));
$$;
REVOKE ALL ON FUNCTION public.approve_expense(uuid,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_expense(uuid,text,text,text,text) TO authenticated;
DO $revoke$
BEGIN
  IF to_regprocedure('public.approve_expense(uuid,text,text,text,text,text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.approve_expense(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
  END IF;
END;
$revoke$;
COMMIT;
