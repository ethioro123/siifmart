-- Index the site foreign key and evaluate session identity once per return-list query.
CREATE INDEX fulfillment_returns_site ON public.fulfillment_return_requests(site_id);
ALTER POLICY fulfillment_returns_read ON public.fulfillment_return_requests
 USING(public.is_site_in_my_authorized_scope(site_id::text,country_code) AND public.is_country_in_my_authorized_scope(country_code)
 AND (requested_by=(SELECT auth.uid()) OR (SELECT public.get_my_role()) IN('group_ceo','country_managing_director','country_finance_director','regional_finance_manager','store_manager')));
