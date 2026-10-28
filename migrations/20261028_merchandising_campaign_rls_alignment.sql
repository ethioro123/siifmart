-- Migration: 20261028_merchandising_campaign_rls_alignment.sql
-- Aligns RLS policies and trigger for public.merchandising_campaign_proposals
-- to enforce country sovereignty, executive access, and preparation permissions.

-- 1. Align guard trigger for campaign proposal creation & updates
CREATE OR REPLACE FUNCTION private.guard_merchandising_campaign_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE home public.sites%ROWTYPE;
DECLARE target_country text;
DECLARE hq_site uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    IF TG_OP = 'UPDATE'
       AND current_setting('app.merch_campaign_decision', true) = OLD.id::text
       AND (
         (NEW.status = 'approved'
          AND (to_jsonb(NEW) - ARRAY['status','approved_by_employee_id','approved_at'])
            = (to_jsonb(OLD) - ARRAY['status','approved_by_employee_id','approved_at']))
         OR
         (NEW.status = 'rejected'
          AND (to_jsonb(NEW) - ARRAY['status','rejection_reason','rejected_by_employee_id','rejected_at'])
            = (to_jsonb(OLD) - ARRAY['status','rejection_reason','rejected_by_employee_id','rejected_at']))
       ) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Campaign decisions require the approval workflow';
  END IF;

  SELECT * INTO actor FROM public.employees WHERE id = (SELECT auth.uid());
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;

  IF actor.id IS NULL OR COALESCE(lower(actor.status),'active') <> 'active'
     OR lower(actor.role) NOT IN (
       'merchandising_specialist',
       'regional_merchandising_lead',
       'regional_merchandising_manager',
       'head_of_merchandising',
       'merchandising_head',
       'merchandising_manager',
       'country_commercial_director',
       'group_ceo',
       'super_admin',
       'ceo'
     )
     OR home.id IS NULL OR home.type <> 'Administration' THEN
    RAISE EXCEPTION 'Campaign preparation is outside authorized scope';
  END IF;

  -- Determine target country and site
  IF lower(actor.role) IN ('group_ceo', 'super_admin', 'ceo') THEN
    target_country := upper(COALESCE(NULLIF(NEW.country_code, ''), home.country));
    IF target_country NOT IN ('KE', 'ET') OR NOT public.is_country_in_my_authorized_scope(target_country) THEN
      RAISE EXCEPTION 'Campaign preparation is outside authorized country scope';
    END IF;

    SELECT id INTO hq_site FROM public.sites WHERE code = target_country || '-HQ' AND type = 'Administration' LIMIT 1;
    NEW.scope_site_id := COALESCE(hq_site, home.id);
    NEW.country_code := target_country;
    NEW.region_code := NULL;
  ELSE
    IF NOT private.merchandising_site_scope(home.id::text, home.country) THEN
      RAISE EXCEPTION 'Campaign preparation is outside authorized scope';
    END IF;
    NEW.scope_site_id := home.id;
    NEW.country_code := upper(home.country);
    NEW.region_code := home.region_code;
  END IF;

  NEW.requested_by_employee_id := actor.id;
  NEW.status := 'pending';
  NEW.approved_by_employee_id := NULL;
  NEW.approved_at := NULL;
  NEW.rejection_reason := NULL;
  NEW.rejected_by_employee_id := NULL;
  NEW.rejected_at := NULL;
  NEW.discount_value := round(NEW.discount_value);
  NEW.code := upper(trim(NEW.code));
  RETURN NEW;
END;
$function$;

-- 2. Align RLS policies on public.merchandising_campaign_proposals
DROP POLICY IF EXISTS merchandising_campaign_proposals_read ON public.merchandising_campaign_proposals;
DROP POLICY IF EXISTS merchandising_campaign_proposals_executive_read ON public.merchandising_campaign_proposals;
DROP POLICY IF EXISTS merchandising_campaign_proposals_create ON public.merchandising_campaign_proposals;

CREATE POLICY merchandising_campaign_proposals_read
ON public.merchandising_campaign_proposals FOR SELECT TO authenticated
USING (
  (lower(coalesce(public.get_my_role(), '')) IN (
     'group_ceo',
     'super_admin',
     'ceo',
     'head_of_merchandising',
     'merchandising_head',
     'merchandising_manager'
   ) AND public.is_country_in_my_authorized_scope(country_code))
  OR private.merchandising_site_scope(scope_site_id::text, country_code)
);

CREATE POLICY merchandising_campaign_proposals_create
ON public.merchandising_campaign_proposals FOR INSERT TO authenticated
WITH CHECK (
  (lower(coalesce(public.get_my_role(), '')) IN (
     'group_ceo',
     'super_admin',
     'ceo',
     'head_of_merchandising',
     'merchandising_head',
     'merchandising_manager'
   ) AND public.is_country_in_my_authorized_scope(country_code))
  OR private.merchandising_site_scope(scope_site_id::text, country_code)
);
