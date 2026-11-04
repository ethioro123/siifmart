BEGIN;
CREATE OR REPLACE FUNCTION private.operations_review_scope_sites(p_anchor uuid,p_country text)
RETURNS TABLE(site_id uuid,site_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; anchor_type text; portfolio boolean;
BEGIN
 PERFORM private.require_operations_review_scope(p_anchor,p_country);
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 SELECT type INTO anchor_type FROM public.sites WHERE id=p_anchor;
 portfolio:=anchor_type='Administration' AND actor.role IN('group_ceo','country_managing_director','country_operations_director',
 'regional_operations_manager','regional_supply_chain_manager','inventory_manager');
 RETURN QUERY SELECT s.id,s.name::text FROM public.sites s WHERE s.country=p_country
 AND (s.id=p_anchor OR portfolio)
 AND public.is_site_in_my_authorized_scope(s.id::text,p_country);
END; $$;
COMMIT;
