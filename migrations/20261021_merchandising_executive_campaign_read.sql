CREATE POLICY merchandising_campaign_proposals_executive_read
ON public.merchandising_campaign_proposals FOR SELECT TO authenticated
USING (public.is_ceo());
