BEGIN;
CREATE OR REPLACE FUNCTION private.operations_review_queue(p_site uuid,p_country text,p_operation text,p_mode text,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF p_mode IS NULL OR p_mode NOT IN('exceptions','active','history','partial') OR p_offset IS NULL OR p_offset<0 OR p_offset>100000
 OR p_operation IS NULL OR p_operation NOT IN('ALL','RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS') THEN RAISE EXCEPTION 'Valid operation, view and page required'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (
 SELECT dedup.source,dedup.id,dedup.operation,dedup.reference,dedup.status,dedup.handler,dedup.occurred_at,dedup.exception,dedup.site_id,dedup.site_name
 FROM (
 SELECT DISTINCT ON(r.source,r.id) r.source,r.id,r.operation,r.reference,r.status,r.handler,r.occurred_at,r.exception,s.site_id,s.site_name
 FROM private.operations_review_scope_sites(p_site,p_country) s
 CROSS JOIN LATERAL private.operations_review_rows(s.site_id,p_country) r
 LEFT JOIN public.wms_jobs owner_job ON r.source='job' AND owner_job.id=r.id
 WHERE (p_operation='ALL' OR r.operation=p_operation)
 AND CASE p_mode WHEN 'exceptions' THEN r.exception WHEN 'partial' THEN r.operation='RECEIVE' AND r.status='Partially Received' WHEN 'history' THEN r.status IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded')
 ELSE r.status NOT IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded') END
 ORDER BY r.source,r.id,(owner_job.site_id=s.site_id) DESC NULLS LAST,s.site_id
 )dedup
 ORDER BY CASE WHEN p_mode='active' AND dedup.status IN('In-Progress','In Progress','In-Transit','Partially Received') THEN 0 ELSE 1 END,
 dedup.occurred_at DESC,dedup.source,dedup.id LIMIT 25 OFFSET p_offset)q),'[]');
END; $$;
COMMIT;
