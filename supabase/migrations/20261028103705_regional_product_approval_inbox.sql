BEGIN;
-- Read-only inbox: caller permissions and existing RLS remain in force.
CREATE OR REPLACE FUNCTION public.get_my_product_approval_inbox(p_country_code text,p_limit integer DEFAULT 5)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE actor record; result jsonb;
BEGIN
 SELECT e.id,e.name,e.email,e.role,coalesce(e.region_code,home.region_code) AS region_code,upper(home.country) AS country_code
 INTO actor FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,'active'))='active';
 IF actor.id IS NULL OR actor.role NOT IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')
 OR actor.region_code IS NULL OR actor.country_code IS DISTINCT FROM upper(p_country_code) THEN
  RAISE EXCEPTION 'Regional approval inbox requires an active regional approver in the requested country' USING ERRCODE='42501';
 END IF;
 WITH scoped AS (
  SELECT r.id,r.layout_revision_id,r.product_name,r.site_id,s.name AS site_name,r.requested_at,r.requested_by,
   r.proposed_changes,
   coalesce(r.requested_by_employee_id=actor.id OR lower(trim(r.requested_by))=lower(trim(actor.name))
    OR lower(trim(r.requested_by))=lower(trim(actor.email)),false)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(r.product_edit_approvals,'[]'::jsonb)) vote
    WHERE vote->>'role'=actor.role OR vote->>'employeeId'=actor.id::text) AS already_handled
  FROM public.inventory_requests r JOIN public.sites s ON s.id::text=r.site_id
  WHERE r.change_type='edit' AND r.status='pending'
   AND upper(r.country_code)=actor.country_code AND upper(s.country)=actor.country_code
   AND lower(s.region_code)=lower(actor.region_code)
   AND private.product_edit_region_scope(r.site_id)
 ), grouped AS (
  SELECT coalesce(layout_revision_id,id) AS id,min(id::text)::uuid AS request_id,
   min(layout_revision_id::text)::uuid AS revision_id,min(site_id) AS site_id,min(site_name) AS site_name,
   min(requested_at) AS submitted_at,min(requested_by) AS requester,count(*)::integer AS move_count,
   min(product_name) AS product_name,bool_or(proposed_changes ?| ARRAY['price','costPrice','salePrice','isOnSale']) AS is_price
  FROM scoped GROUP BY coalesce(layout_revision_id,id)
  HAVING NOT bool_or(already_handled)
 ), labeled AS (
  SELECT id,request_id,revision_id,site_id,site_name,submitted_at,requester,move_count,
   CASE WHEN revision_id IS NOT NULL THEN 'planogram' WHEN is_price THEN 'price' ELSE 'product' END AS kind,
   CASE WHEN revision_id IS NOT NULL THEN move_count::text || ' shelf move' || CASE WHEN move_count=1 THEN '' ELSE 's' END
    ELSE coalesce(product_name,'Product change') END AS title
  FROM grouped
 )
 SELECT jsonb_build_object('total',count(*),'planogramCount',count(*) FILTER(WHERE kind='planogram'),
  'priceCount',count(*) FILTER(WHERE kind='price'),'productCount',count(*) FILTER(WHERE kind='product'),
  'items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'requestId',i.request_id,'revisionId',i.revision_id,
   'siteId',i.site_id,'siteName',i.site_name,'submittedAt',i.submitted_at,'requester',i.requester,
   'productCount',i.move_count,'kind',i.kind,'title',i.title) ORDER BY i.submitted_at,i.id)
   FROM (SELECT id,request_id,revision_id,site_id,site_name,submitted_at,requester,move_count,kind,title
    FROM labeled ORDER BY submitted_at,id LIMIT greatest(1,least(coalesce(p_limit,5),25))) i),'[]'::jsonb))
 INTO result FROM labeled;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_product_approval_inbox(text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_product_approval_inbox(text,integer) TO authenticated;
COMMIT;
