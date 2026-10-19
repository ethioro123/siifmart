-- Restore transfer discrepancy case access after tenant hardening removed the
-- old authenticated-wide policies. Every read/write is scoped through the
-- destination site recorded on the resolution or its parent resolution.

ALTER TABLE public.discrepancy_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discrepancy_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discrepancy_resolutions_read ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_insert ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_update ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_delete ON public.discrepancy_resolutions;

CREATE POLICY discrepancy_resolutions_read ON public.discrepancy_resolutions
FOR SELECT TO authenticated
USING (site_id IS NOT NULL AND public.is_site_in_my_authorized_scope(site_id::text, NULL));

CREATE POLICY discrepancy_resolutions_insert ON public.discrepancy_resolutions
FOR INSERT TO authenticated
WITH CHECK (site_id IS NOT NULL AND public.is_site_in_my_authorized_scope(site_id::text, NULL));

CREATE POLICY discrepancy_resolutions_update ON public.discrepancy_resolutions
FOR UPDATE TO authenticated
USING (site_id IS NOT NULL AND public.is_site_in_my_authorized_scope(site_id::text, NULL))
WITH CHECK (site_id IS NOT NULL AND public.is_site_in_my_authorized_scope(site_id::text, NULL));

DROP POLICY IF EXISTS discrepancy_claims_read ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_insert ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_update ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_delete ON public.discrepancy_claims;

CREATE POLICY discrepancy_claims_read ON public.discrepancy_claims
FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.discrepancy_resolutions r
    WHERE r.id = resolution_id AND r.site_id IS NOT NULL
      AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
));

CREATE POLICY discrepancy_claims_insert ON public.discrepancy_claims
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.discrepancy_resolutions r
    WHERE r.id = resolution_id AND r.site_id IS NOT NULL
      AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
));

CREATE POLICY discrepancy_claims_update ON public.discrepancy_claims
FOR UPDATE TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.discrepancy_resolutions r
    WHERE r.id = resolution_id AND r.site_id IS NOT NULL
      AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.discrepancy_resolutions r
    WHERE r.id = resolution_id AND r.site_id IS NOT NULL
      AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
));

GRANT SELECT, INSERT, UPDATE ON public.discrepancy_resolutions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.discrepancy_claims TO authenticated;
