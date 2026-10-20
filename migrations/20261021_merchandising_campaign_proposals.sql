CREATE TABLE public.merchandising_campaign_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_site_id uuid NOT NULL REFERENCES public.sites(id),
  country_code text NOT NULL,
  region_code text,
  code text NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,32}$'),
  discount_type text NOT NULL CHECK (discount_type IN ('PERCENTAGE','FIXED')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  expiry_date date NOT NULL CHECK (expiry_date > CURRENT_DATE),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by_employee_id uuid NOT NULL REFERENCES public.employees(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by_employee_id uuid REFERENCES public.employees(id),
  approved_at timestamptz,
  CHECK (discount_type <> 'PERCENTAGE' OR discount_value <= 100)
);

CREATE INDEX merchandising_campaign_proposals_scope_pending_idx
  ON public.merchandising_campaign_proposals(country_code, region_code, requested_at DESC)
  WHERE status = 'pending';

CREATE FUNCTION private.guard_merchandising_campaign_proposal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE home public.sites%ROWTYPE;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    IF TG_OP = 'UPDATE'
       AND current_setting('app.merch_campaign_decision', true) = OLD.id::text
       AND NEW.status = 'approved'
       AND (to_jsonb(NEW) - ARRAY['status','approved_by_employee_id','approved_at'])
         = (to_jsonb(OLD) - ARRAY['status','approved_by_employee_id','approved_at']) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Campaign decisions require the approval workflow';
  END IF;
  SELECT * INTO actor FROM public.employees WHERE id = (SELECT auth.uid());
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;
  IF actor.id IS NULL OR COALESCE(lower(actor.status),'active') <> 'active'
     OR lower(actor.role) NOT IN ('merchandising_specialist','regional_merchandising_lead',
       'head_of_merchandising','merchandising_head','merchandising_manager')
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
  NEW.code := upper(trim(NEW.code));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER guard_merchandising_campaign_proposal
BEFORE INSERT OR UPDATE OR DELETE ON public.merchandising_campaign_proposals
FOR EACH ROW EXECUTE FUNCTION private.guard_merchandising_campaign_proposal();

ALTER TABLE public.merchandising_campaign_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY merchandising_campaign_proposals_read
ON public.merchandising_campaign_proposals FOR SELECT TO authenticated
USING (private.merchandising_site_scope(scope_site_id::text, country_code));
CREATE POLICY merchandising_campaign_proposals_create
ON public.merchandising_campaign_proposals FOR INSERT TO authenticated
WITH CHECK (private.merchandising_site_scope(scope_site_id::text, country_code));

GRANT SELECT, INSERT ON public.merchandising_campaign_proposals TO authenticated;

CREATE FUNCTION public.approve_merchandising_campaign(p_proposal_id uuid)
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
     OR lower(actor.role) NOT IN ('super_admin','ceo','head_of_merchandising',
       'merchandising_head','merchandising_manager','regional_merchandising_lead')
     OR (lower(actor.role) NOT IN ('super_admin','ceo')
       AND NOT private.merchandising_site_scope(proposal.scope_site_id::text,proposal.country_code)) THEN
    RAISE EXCEPTION 'Campaign approval is outside authorized scope';
  END IF;
  -- Approval records the merchandising decision. POS discount activation is a separate workflow.
  PERFORM set_config('app.merch_campaign_decision', proposal.id::text, true);
  UPDATE public.merchandising_campaign_proposals SET status = 'approved',
    approved_by_employee_id = actor.id, approved_at = now() WHERE id = proposal.id;
  PERFORM set_config('app.merch_campaign_decision', '', true);
END;
$function$;
REVOKE ALL ON FUNCTION public.approve_merchandising_campaign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_merchandising_campaign(uuid) TO authenticated;
