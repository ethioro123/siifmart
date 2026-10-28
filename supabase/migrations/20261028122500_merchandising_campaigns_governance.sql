-- Migration: 20261028_merchandising_campaigns_governance.sql
-- Merchandising campaigns governance: whole-number rule, country validation for group_ceo,
-- duplicate prevention, and rejection decision workflow.

-- 1. Add rejection tracking columns
ALTER TABLE public.merchandising_campaign_proposals
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_by_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 2. Enforce whole-number rule for discount values
ALTER TABLE public.merchandising_campaign_proposals
  DROP CONSTRAINT IF EXISTS chk_merchandising_campaign_discount_whole_number,
  ADD CONSTRAINT chk_merchandising_campaign_discount_whole_number
  CHECK (discount_value = round(discount_value));

-- 3. Enforce unique campaign code per country for pending/approved proposals
CREATE UNIQUE INDEX IF NOT EXISTS merchandising_campaign_proposals_country_code_uidx
  ON public.merchandising_campaign_proposals(country_code, code)
  WHERE status IN ('pending', 'approved');

-- 4. Update guard trigger to support both approval and rejection workflows
CREATE OR REPLACE FUNCTION private.guard_merchandising_campaign_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE home public.sites%ROWTYPE;
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
     OR lower(actor.role) NOT IN ('merchandising_specialist','regional_merchandising_lead',
       'regional_merchandising_manager','head_of_merchandising','merchandising_head',
       'merchandising_manager','country_commercial_director','group_ceo')
     OR home.id IS NULL OR home.type <> 'Administration'
     OR NOT private.merchandising_site_scope(home.id::text, home.country) THEN
    RAISE EXCEPTION 'Campaign preparation is outside authorized scope';
  END IF;
  NEW.scope_site_id := home.id;
  NEW.country_code := upper(home.country);
  NEW.region_code := home.region_code;
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

-- 5. Update approve_merchandising_campaign with country boundary validation
CREATE OR REPLACE FUNCTION public.approve_merchandising_campaign(p_proposal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE proposal public.merchandising_campaign_proposals%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.employees WHERE id = (SELECT auth.uid())
    AND COALESCE(lower(status),'active') = 'active';
  SELECT * INTO proposal FROM public.merchandising_campaign_proposals
    WHERE id = p_proposal_id FOR UPDATE;
  IF actor.id IS NULL OR proposal.id IS NULL OR proposal.status <> 'pending'
     OR actor.id = proposal.requested_by_employee_id
     OR lower(actor.role) NOT IN ('super_admin','ceo','group_ceo','head_of_merchandising',
       'merchandising_head','merchandising_manager','regional_merchandising_lead',
       'regional_merchandising_manager','country_commercial_director') THEN
    RAISE EXCEPTION 'Campaign approval is outside authorized scope';
  END IF;

  IF upper(COALESCE(proposal.country_code, '')) NOT IN ('KE', 'ET') THEN
    RAISE EXCEPTION 'Proposal country code is invalid';
  END IF;

  IF lower(actor.role) IN ('super_admin','ceo','group_ceo') THEN
    IF NOT public.is_country_in_my_authorized_scope(proposal.country_code) THEN
      RAISE EXCEPTION 'Campaign approval is outside authorized country scope';
    END IF;
  ELSE
    IF NOT private.merchandising_site_scope(proposal.scope_site_id::text, proposal.country_code) THEN
      RAISE EXCEPTION 'Campaign approval is outside authorized scope';
    END IF;
  END IF;

  -- Approval records the merchandising decision. POS discount activation is a separate workflow.
  PERFORM set_config('app.merch_campaign_decision', proposal.id::text, true);
  UPDATE public.merchandising_campaign_proposals
    SET status = 'approved',
        approved_by_employee_id = actor.id,
        approved_at = now()
    WHERE id = proposal.id;
  PERFORM set_config('app.merch_campaign_decision', '', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.approve_merchandising_campaign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_merchandising_campaign(uuid) TO authenticated;

-- 6. Add reject_merchandising_campaign RPC with scope & country validation
CREATE OR REPLACE FUNCTION public.reject_merchandising_campaign(p_proposal_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE proposal public.merchandising_campaign_proposals%ROWTYPE;
DECLARE clean_reason text;
BEGIN
  clean_reason := trim(COALESCE(p_reason, ''));
  IF length(clean_reason) < 3 THEN
    RAISE EXCEPTION 'A valid rejection reason of at least 3 characters is required';
  END IF;

  SELECT * INTO actor FROM public.employees WHERE id = (SELECT auth.uid())
    AND COALESCE(lower(status),'active') = 'active';
  SELECT * INTO proposal FROM public.merchandising_campaign_proposals
    WHERE id = p_proposal_id FOR UPDATE;
  IF actor.id IS NULL OR proposal.id IS NULL OR proposal.status <> 'pending'
     OR actor.id = proposal.requested_by_employee_id
     OR lower(actor.role) NOT IN ('super_admin','ceo','group_ceo','head_of_merchandising',
       'merchandising_head','merchandising_manager','regional_merchandising_lead',
       'regional_merchandising_manager','country_commercial_director') THEN
    RAISE EXCEPTION 'Campaign rejection is outside authorized scope';
  END IF;

  IF upper(COALESCE(proposal.country_code, '')) NOT IN ('KE', 'ET') THEN
    RAISE EXCEPTION 'Proposal country code is invalid';
  END IF;

  IF lower(actor.role) IN ('super_admin','ceo','group_ceo') THEN
    IF NOT public.is_country_in_my_authorized_scope(proposal.country_code) THEN
      RAISE EXCEPTION 'Campaign rejection is outside authorized country scope';
    END IF;
  ELSE
    IF NOT private.merchandising_site_scope(proposal.scope_site_id::text, proposal.country_code) THEN
      RAISE EXCEPTION 'Campaign rejection is outside authorized scope';
    END IF;
  END IF;

  PERFORM set_config('app.merch_campaign_decision', proposal.id::text, true);
  UPDATE public.merchandising_campaign_proposals
    SET status = 'rejected',
        rejection_reason = clean_reason,
        rejected_by_employee_id = actor.id,
        rejected_at = now()
    WHERE id = proposal.id;
  PERFORM set_config('app.merch_campaign_decision', '', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.reject_merchandising_campaign(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_merchandising_campaign(uuid, text) TO authenticated;
