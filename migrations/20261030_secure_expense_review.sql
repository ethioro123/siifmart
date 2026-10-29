BEGIN;
CREATE OR REPLACE FUNCTION public.guard_expense_review()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE actor public.employees%ROWTYPE; actor_role text; regional_limit numeric := 2000000;
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
 IF coalesce(OLD.escalated_to_ceo,false) OR OLD.amount>20000000 THEN
   IF actor_role NOT IN ('group_ceo','group_cfo') THEN RAISE EXCEPTION 'Group Finance or CEO required'; END IF;
 ELSIF actor_role IN ('regional_finance_manager','regional_operations_manager') THEN
   SELECT least(coalesce(r.autonomous_expense_limit,2000000),2000000) INTO regional_limit FROM public.regions r WHERE r.code=OLD.region_code;
   IF OLD.amount>coalesce(regional_limit,2000000) THEN RAISE EXCEPTION 'Country sign-off required'; END IF;
 END IF;
 IF coalesce(current_setting('siifmart.expense_review_reason',true),'')='' THEN RAISE EXCEPTION 'Use the expense decision function with a reason'; END IF;
 IF NEW.status='Approved' THEN NEW.approved_by_id:=actor.id; NEW.approved_by:=actor.name; NEW.approved_at:=now(); END IF;
 NEW.updated_at:=now();
 INSERT INTO public.system_logs(user_name,action,module,details,site_id,country_code)
 VALUES(actor.name,'EXPENSE_'||upper(NEW.status),'Financials',jsonb_build_object('expense_id',OLD.id,'amount',OLD.amount,'reason',current_setting('siifmart.expense_review_reason',true))::text,OLD.site_id,OLD.country_code);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_expense_review() FROM PUBLIC;
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
COMMIT;
