BEGIN;
CREATE OR REPLACE FUNCTION private.blind_receipt_detail(p_receipt uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; result jsonb; manager boolean;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 manager:=private.blind_receipt_manager(r.site_id,r.country_code) AND r.employee_id<>auth.uid();
 IF NOT manager AND r.employee_id<>auth.uid() THEN RAISE EXCEPTION 'Independent receipt reviewer required' USING ERRCODE='42501'; END IF;
 result:=to_jsonb(r)-'expected_qty'-'previous_qty';
 IF manager THEN result:=result||jsonb_build_object('expected_qty',r.expected_qty,'previous_qty',r.previous_qty); END IF;
 RETURN result||jsonb_build_object('needs_review',private.blind_receipt_needs_review(r.id),'can_review',manager,'can_correct',r.employee_id=auth.uid(),
 'corrections',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.created_at),'[]') FROM private.blind_receipt_corrections c WHERE receipt_id=r.id),
 'decisions',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.created_at),'[]') FROM private.blind_receipt_decisions d WHERE receipt_id=r.id));
END; $$;
COMMIT;
