CREATE FUNCTION private.merchandising_finance_scope(p_site_id text, p_country_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    JOIN public.sites target ON target.id::text = p_site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status),'active') = 'active'
      AND lower(actor.role) IN ('finance_manager','head_of_finance','finance_head','regional_finance_officer')
      AND home.type = 'Administration'
      AND upper(home.country) = upper(target.country)
      AND upper(p_country_code) = upper(target.country)
      AND (
        (home.code = upper(home.country) || '-HQ' AND home.region_code IS NULL
          AND actor.region_code IS NULL AND lower(actor.role) <> 'regional_finance_officer')
        OR (home.region_code IS NOT NULL AND actor.region_code = home.region_code
          AND target.region_code = home.region_code)
      )
  );
$function$;
REVOKE ALL ON FUNCTION private.merchandising_finance_scope(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.merchandising_finance_scope(text,text) TO authenticated;

CREATE FUNCTION private.guard_merchandising_finance_signoff()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.finance_approved_by_employee_id IS NOT DISTINCT FROM OLD.finance_approved_by_employee_id
     AND NEW.finance_approved_at IS NOT DISTINCT FROM OLD.finance_approved_at THEN
    RETURN NEW;
  END IF;
  IF current_setting('app.merchandising_finance_signoff_id', true) IS DISTINCT FROM OLD.id::text
     OR NEW.finance_approved_by_employee_id IS DISTINCT FROM (SELECT auth.uid())
     OR NEW.finance_approved_at IS NULL
     OR OLD.status <> 'pending'
     OR OLD.adjustment_reason NOT LIKE 'PRICE_CHANGE%'
     OR (to_jsonb(NEW) - ARRAY['finance_approved_by_employee_id','finance_approved_at'])
       <> (to_jsonb(OLD) - ARRAY['finance_approved_by_employee_id','finance_approved_at']) THEN
    RAISE EXCEPTION 'Finance signoff requires the authorized decision workflow';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER guard_merchandising_finance_signoff
BEFORE UPDATE ON public.inventory_requests FOR EACH ROW
EXECUTE FUNCTION private.guard_merchandising_finance_signoff();

CREATE OR REPLACE FUNCTION public.finance_signoff_merchandising_price(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE request public.inventory_requests%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.employees
  WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  SELECT * INTO request FROM public.inventory_requests WHERE id = p_request_id FOR UPDATE;
  IF actor.id IS NULL OR request.id IS NULL OR request.status <> 'pending'
     OR request.adjustment_reason NOT LIKE 'PRICE_CHANGE%'
     OR request.finance_approved_by_employee_id IS NOT NULL
     OR lower(actor.role) NOT IN ('finance_manager','head_of_finance','finance_head',
       'regional_finance_officer','super_admin','ceo')
     OR (lower(actor.role) NOT IN ('super_admin','ceo')
         AND NOT private.merchandising_finance_scope(request.site_id, request.country_code::text))
     OR actor.id = request.requested_by_employee_id THEN
    RAISE EXCEPTION 'Finance sign-off is outside the authorized request scope';
  END IF;
  PERFORM set_config('app.merchandising_finance_signoff_id', request.id::text, true);
  UPDATE public.inventory_requests
  SET finance_approved_by_employee_id = actor.id, finance_approved_at = now()
  WHERE id = request.id;
  PERFORM set_config('app.merchandising_finance_signoff_id', '', true);
END;
$function$;

-- A merchandising approver cannot also supply the independent Finance signoff.
CREATE OR REPLACE FUNCTION private.merchandising_distinct_finance_approver()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved'
     AND NEW.finance_approved_by_employee_id = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Merchandising and Finance approvals require different employees';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER merchandising_distinct_finance_approver
BEFORE UPDATE OF status ON public.inventory_requests FOR EACH ROW
EXECUTE FUNCTION private.merchandising_distinct_finance_approver();
