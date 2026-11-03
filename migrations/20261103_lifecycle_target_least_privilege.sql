BEGIN;
DROP POLICY lifecycle_requests_read ON public.record_lifecycle_requests;
CREATE POLICY lifecycle_requests_read ON public.record_lifecycle_requests FOR SELECT TO authenticated
 USING(private.lifecycle_visible(site_id,country_code) AND (requested_by=auth.uid()
 OR private.lifecycle_current_role() IN ('group_ceo','auditor','country_compliance_manager','regional_compliance_manager','group_clco','group_cae')
 OR CASE kind
 WHEN 'employee' THEN private.lifecycle_current_role() IN ('regional_hr_manager','country_hr_director','group_chro')
   AND target_id<>auth.uid() AND private.lifecycle_rank(private.lifecycle_current_role())>private.lifecycle_rank(original_state->>'role')
 WHEN 'site' THEN private.lifecycle_current_role() IN ('country_operations_director','country_finance_director','country_managing_director','regional_operations_manager')
 WHEN 'purchase_order' THEN private.lifecycle_current_role() IN ('regional_procurement_manager','country_commercial_director','group_cco','country_finance_director','regional_finance_manager')
 ELSE private.lifecycle_current_role() IN ('store_manager','warehouse_manager','regional_operations_manager','regional_logistics_manager','regional_supply_chain_manager','country_operations_director','country_supply_chain_director','group_csco') END));
CREATE OR REPLACE FUNCTION public.list_lifecycle_targets(p_kind text,p_country text,p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,label text,state text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 IF actor.id IS NULL OR auth.uid() IS NULL OR p_country NOT IN ('ET','KE') OR length(coalesce(p_search,''))>100 OR p_offset<0 OR p_offset>10000 THEN
   RAISE EXCEPTION 'A valid authenticated country scope is required'; END IF;
 RETURN QUERY SELECT candidate.id,candidate.label::text,candidate.state::text FROM (
   SELECT e.id,e.name AS label,e.status::text AS state,e.site_id,s.country::text AS country
   FROM public.employees e JOIN public.sites s ON s.id=e.site_id
   WHERE p_kind='employee' AND e.status<>'Terminated' AND e.id<>actor.id AND private.lifecycle_rank(actor.role)>private.lifecycle_rank(e.role)
   UNION ALL
   SELECT s.id,s.name,s.status::text,s.id,s.country::text FROM public.sites s
   WHERE p_kind='site' AND actor.role IN ('group_ceo','country_managing_director','country_operations_director','regional_operations_manager') AND s.status<>'Closed' AND s.type IN ('Store','Warehouse','Distribution Center')
   UNION ALL
   SELECT p.id,coalesce(p.po_number,p.id::text),p.status,p.site_id,p.country_code::text
   FROM public.purchase_orders p WHERE p_kind='purchase_order' AND p.status IN ('Draft','Pending') AND (private.lifecycle_rank(actor.role)>0 OR (actor.role IN ('buyer','demand_planner','replenishment_planner') AND (coalesce(p.created_by,'') IN (actor.name,actor.id::text) OR coalesce(p.requested_by,'') IN (actor.name,actor.id::text))))
   UNION ALL
   SELECT j.id,coalesce(j.job_number,j.order_ref,j.id::text),j.status::text,j.site_id,j.country_code::text
   FROM public.wms_jobs j WHERE p_kind='warehouse_job' AND j.status='Pending' AND (private.lifecycle_rank(actor.role)>0 OR coalesce(j.requested_by,'') IN (actor.name,actor.id::text))
     AND coalesce(j.assigned_to,'') IN ('','Unassigned') AND coalesce(j.transfer_status,'Draft') IN ('Draft','Requested','Pending_Approval','Rejected')
   UNION ALL
   SELECT t.id,coalesce(t.order_ref,t.id::text),t.status::text,t.source_site_id,t.country_code
   FROM public.transfers t WHERE p_kind='transfer' AND (private.lifecycle_rank(actor.role)>0 OR coalesce(t.requested_by,'') IN (actor.name,actor.id::text)) AND t.status IN ('Requested','Rejected')
     AND t.dispatched_at IS NULL AND t.shipped_at IS NULL AND t.received_at IS NULL AND t.approved_at IS NULL
     AND private.lifecycle_visible(t.dest_site_id,t.country_code)
 ) candidate WHERE upper(candidate.country)=p_country AND private.lifecycle_visible(candidate.site_id,candidate.country)
   AND candidate.label ILIKE '%'||coalesce(p_search,'')||'%'
 ORDER BY candidate.label,candidate.id LIMIT 25 OFFSET p_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) TO authenticated;
COMMIT;
