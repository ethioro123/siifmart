BEGIN;
CREATE TABLE private.blind_receipt_issues (
 receipt_id uuid PRIMARY KEY REFERENCES private.blind_receipt_counts(id),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1200),
 employee_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.blind_receipt_issues ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.blind_receipt_issues FROM PUBLIC,anon,authenticated;
CREATE TRIGGER blind_receipt_issues_immutable BEFORE UPDATE OR DELETE ON private.blind_receipt_issues FOR EACH ROW EXECUTE FUNCTION private.blind_receipt_append_only();
CREATE OR REPLACE FUNCTION private.blind_receipt_needs_review(p_receipt uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM private.blind_receipt_counts r WHERE r.id=p_receipt AND
 (((r.previous_qty+r.physical_qty>r.expected_qty OR EXISTS(SELECT 1 FROM jsonb_array_elements(r.lines) l WHERE l->>'condition'<>'Good')
 OR EXISTS(SELECT 1 FROM private.blind_receipt_issues i WHERE i.receipt_id=r.id))
 AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND d.correction_id IS NULL))
 OR EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id))));
$$;
CREATE FUNCTION private.report_blind_receipt_issue(p_receipt uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; issue private.blind_receipt_issues%ROWTYPE;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 IF r.employee_id<>auth.uid() THEN RAISE EXCEPTION 'Only the original counter may report a receipt issue' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 THEN RAISE EXCEPTION 'An observed delivery issue and reason are required'; END IF;
 PERFORM 1 FROM public.purchase_orders WHERE id=r.po_id FOR UPDATE;
 SELECT * INTO issue FROM private.blind_receipt_issues WHERE receipt_id=r.id;
 IF issue.receipt_id IS NOT NULL THEN
 IF issue.reason<>btrim(p_reason) THEN RAISE EXCEPTION 'Original delivery issue cannot be overwritten'; END IF;
 RETURN jsonb_build_object('id',r.id,'saved',true); END IF;
 IF EXISTS(SELECT 1 FROM private.blind_receipt_decisions WHERE receipt_id=r.id AND correction_id IS NULL) THEN RAISE EXCEPTION 'Receipt already reviewed; use independent inventory investigation'; END IF;
 INSERT INTO private.blind_receipt_issues(receipt_id,reason,employee_id) VALUES(r.id,btrim(p_reason),auth.uid());
 RETURN jsonb_build_object('id',r.id,'saved',true);
END; $$;
CREATE FUNCTION public.report_blind_receipt_issue(p_receipt uuid,p_reason text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.report_blind_receipt_issue(p_receipt,p_reason); $$;
REVOKE ALL ON FUNCTION private.report_blind_receipt_issue(uuid,text),public.report_blind_receipt_issue(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.report_blind_receipt_issue(uuid,text),public.report_blind_receipt_issue(uuid,text) TO authenticated;
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
 'issue',(SELECT reason FROM private.blind_receipt_issues WHERE receipt_id=r.id),
 'corrections',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.created_at),'[]') FROM private.blind_receipt_corrections c WHERE receipt_id=r.id),
 'decisions',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.created_at),'[]') FROM private.blind_receipt_decisions d WHERE receipt_id=r.id));
END; $$;
COMMIT;
