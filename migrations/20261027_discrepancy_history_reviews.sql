CREATE TABLE private.floor_discrepancy_reviews (
 discrepancy_id uuid PRIMARY KEY REFERENCES private.floor_discrepancies(id),
 finding text NOT NULL CHECK(finding IN ('counting_correction','stock_issue','confirmed_handling_error','undetermined')),
 responsible_id uuid REFERENCES public.employees(id), notes text NOT NULL CHECK(length(notes) BETWEEN 3 AND 500),
 reviewer_id uuid NOT NULL REFERENCES public.employees(id), reviewed_at timestamptz NOT NULL DEFAULT now(),
 CHECK((finding='confirmed_handling_error')=(responsible_id IS NOT NULL))
);
ALTER TABLE private.floor_discrepancy_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.floor_discrepancy_reviews FROM PUBLIC,anon,authenticated;
CREATE INDEX floor_discrepancy_product ON private.floor_discrepancies(site_id,country_code,(manifest->>'productId'));
CREATE FUNCTION private.floor_audit_timeline(p_site_id uuid,p_country text,p_kind text,p_id uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; manager boolean;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 manager:=actor.role IN ('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager');
 IF auth.uid() IS NULL OR actor.id IS NULL OR p_offset<0 OR p_offset>100000 OR p_offset IS NULL
  OR NOT public.is_site_in_my_authorized_scope(p_site_id::text,p_country)
  OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=p_site_id AND upper(country)=upper(p_country))
  OR p_kind NOT IN ('job','product','employee') OR p_kind IS NULL
  OR (NOT manager AND p_kind='employee' AND p_id<>actor.id)
  OR (NOT manager AND p_kind='product') THEN RAISE EXCEPTION 'Audit history is outside your authorized scope' USING ERRCODE='42501'; END IF;
 IF p_kind='job' THEN PERFORM private.floor_discrepancy_job(p_id); END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
  SELECT d.*,j.job_number,j.order_ref,j.completed_by,j.assigned_to,j.status job_status,
   r.finding,r.responsible_id,(SELECT name FROM public.employees WHERE id=r.responsible_id) responsible_name,(SELECT name FROM public.employees WHERE id=r.reviewer_id) reviewer_name,r.notes review_notes,r.reviewer_id,r.reviewed_at,
   (SELECT coalesce(sum(t.points),0) FROM public.points_transactions t WHERE t.job_id=j.id::text AND t.type='JOB_COMPLETE') awarded_points
  FROM private.floor_discrepancies d JOIN public.wms_jobs j ON j.id=d.job_id
  LEFT JOIN private.floor_discrepancy_reviews r ON r.discrepancy_id=d.id
  WHERE d.site_id=p_site_id AND d.country_code=p_country AND (
   (p_kind='job' AND d.job_id=p_id) OR (p_kind='product' AND d.manifest->>'productId'=p_id::text) OR
   (p_kind='employee' AND (d.reporter_id=p_id OR d.resolver_id=p_id OR r.responsible_id=p_id OR r.reviewer_id=p_id OR
    EXISTS(SELECT 1 FROM public.wms_jobs s WHERE s.site_id=p_site_id AND s.country_code=p_country
     AND (s.id=j.id OR (nullif(j.order_ref,'') IS NOT NULL AND s.order_ref=j.order_ref))
     AND (s.assigned_to=p_id::text OR s.completed_by=p_id::text OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=s.id AND a.employee_id=p_id))))))
  ORDER BY d.reported_at DESC,d.id LIMIT 20 OFFSET p_offset
 )x),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION private.floor_audit_timeline(uuid,text,text,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.floor_audit_timeline(uuid,text,text,uuid,integer) TO authenticated;
CREATE FUNCTION public.floor_audit_timeline(p_site_id uuid,p_country text,p_kind text,p_id uuid,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.floor_audit_timeline(p_site_id,p_country,p_kind,p_id,p_offset); $$;
REVOKE ALL ON FUNCTION public.floor_audit_timeline(uuid,text,text,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.floor_audit_timeline(uuid,text,text,uuid,integer) TO authenticated;

CREATE FUNCTION private.review_floor_discrepancy(p_job_id uuid,p_discrepancy_id uuid,p_finding text,p_responsible_id uuid,p_notes text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; d private.floor_discrepancies%ROWTYPE; actor public.employees%ROWTYPE; review private.floor_discrepancy_reviews%ROWTYPE; award jsonb;
BEGIN
 PERFORM 1 FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 j:=private.floor_discrepancy_job(p_job_id);
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id();
 SELECT * INTO d FROM private.floor_discrepancies WHERE id=p_discrepancy_id AND job_id=j.id FOR UPDATE;
 IF d.id IS NULL OR d.resolved_at IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')
  OR actor.id=d.reporter_id OR actor.id::text=j.assigned_to OR actor.id::text=j.completed_by
  OR EXISTS(SELECT 1 FROM public.wms_jobs s WHERE s.site_id=j.site_id AND s.country_code=j.country_code
    AND (s.id=j.id OR (nullif(j.order_ref,'') IS NOT NULL AND s.order_ref=j.order_ref)) AND
    (s.assigned_to=actor.id::text OR s.completed_by=actor.id::text OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=s.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'A separate scoped supervisor must review a resolved discrepancy' USING ERRCODE='42501'; END IF;
 IF p_finding IS NULL OR p_finding NOT IN ('counting_correction','stock_issue','confirmed_handling_error','undetermined')
  OR length(btrim(coalesce(p_notes,''))) NOT BETWEEN 3 AND 500
  OR (p_finding='confirmed_handling_error')<>(p_responsible_id IS NOT NULL) THEN RAISE EXCEPTION 'Record a finding and evidence; name responsibility only for a confirmed handling error'; END IF;
 IF p_responsible_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.wms_jobs s WHERE s.site_id=j.site_id AND s.country_code=j.country_code
  AND (s.id=j.id OR (nullif(j.order_ref,'') IS NOT NULL AND s.order_ref=j.order_ref)) AND
  (s.assigned_to=p_responsible_id::text OR s.completed_by=p_responsible_id::text OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=s.id AND a.employee_id=p_responsible_id))) THEN
  RAISE EXCEPTION 'Responsibility must refer to a recorded handler of this order' USING ERRCODE='42501'; END IF;
 SELECT * INTO review FROM private.floor_discrepancy_reviews WHERE discrepancy_id=d.id;
 IF review.discrepancy_id IS NOT NULL THEN
  IF review.reviewer_id=actor.id AND review.finding=p_finding AND review.responsible_id IS NOT DISTINCT FROM p_responsible_id AND review.notes=btrim(p_notes) THEN RETURN to_jsonb(review); END IF;
  RAISE EXCEPTION 'Review is append-only; an existing decision cannot be overwritten'; END IF;
 INSERT INTO private.floor_discrepancy_reviews(discrepancy_id,finding,responsible_id,notes,reviewer_id)
 VALUES(d.id,p_finding,p_responsible_id,btrim(p_notes),actor.id) RETURNING * INTO review;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('FLOOR_DISCREPANCY_REVIEWED','Fulfillment',actor.id,j.site_id::text,j.country_code,'wms_job',j.id::text,to_jsonb(review)::text);
 IF j.status='Completed' AND NOT EXISTS(SELECT 1 FROM private.floor_discrepancies x LEFT JOIN private.floor_discrepancy_reviews r ON r.discrepancy_id=x.id
  WHERE x.job_id=j.id AND r.discrepancy_id IS NULL) THEN award:=private.award_completed_warehouse_job(j.id); END IF;
 RETURN to_jsonb(review);
END; $$;
REVOKE ALL ON FUNCTION private.review_floor_discrepancy(uuid,uuid,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.review_floor_discrepancy(uuid,uuid,text,uuid,text) TO authenticated;
CREATE FUNCTION public.review_floor_discrepancy(p_job_id uuid,p_discrepancy_id uuid,p_finding text,p_responsible_id uuid,p_notes text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.review_floor_discrepancy(p_job_id,p_discrepancy_id,p_finding,p_responsible_id,p_notes); $$;
REVOKE ALL ON FUNCTION public.review_floor_discrepancy(uuid,uuid,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_floor_discrepancy(uuid,uuid,text,uuid,text) TO authenticated;
