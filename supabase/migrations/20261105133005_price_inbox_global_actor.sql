-- Permit the active Group CEO to read a country-scoped price summary without a home site.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_my_price_approval_inbox(p_country_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $function$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR p_country_code IS NULL OR (
   upper(p_country_code) IS DISTINCT FROM upper(public.get_my_country_code())
   AND NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id=(SELECT auth.uid())
     AND e.role='group_ceo' AND lower(coalesce(e.status,'active'))='active')
 ) THEN RAISE EXCEPTION 'Price inbox requires your assigned country' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('priceCount',count(*) FILTER(WHERE coalesce((route->>'canApprove')::boolean,false)),
 'financeCount',count(*) FILTER(WHERE coalesce((route->>'canFinance')::boolean,false))) INTO result
 FROM (SELECT private.price_approval_route(r.id) route FROM public.inventory_requests r
 WHERE r.status='pending' AND r.change_type='edit' AND upper(r.country_code)=upper(p_country_code)
 AND private.is_price_change(r.proposed_changes)) routes;
 RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_my_price_approval_inbox(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_price_approval_inbox(text) TO authenticated;
COMMIT;
