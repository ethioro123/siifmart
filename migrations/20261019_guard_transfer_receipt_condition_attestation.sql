CREATE OR REPLACE FUNCTION private.guard_transfer_receipt_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_actor_id uuid := public.get_my_employee_id();
    v_check public.transfer_receipt_verifications%ROWTYPE;
    v_expected_count integer;
    v_actual numeric;
    v_attested numeric;
    v_actual_condition text;
    v_attested_condition text;
    v_index integer := 0;
BEGIN
    IF OLD.type <> 'TRANSFER' OR NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status OR NEW.transfer_status <> 'Received' THEN
        RETURN NEW;
    END IF;
    SELECT * INTO v_check FROM public.transfer_receipt_verifications c WHERE c.job_id = NEW.id FOR UPDATE;
    IF NOT FOUND OR v_check.status <> 'verified' THEN RAISE EXCEPTION 'Independent destination receipt verification is required'; END IF;
    IF v_check.second_counter_id IS NOT NULL THEN
        IF v_check.second_counter_id IS DISTINCT FROM v_actor_id THEN RAISE EXCEPTION 'The independent recounting employee must accept the verified transfer'; END IF;
    ELSIF v_check.first_counter_id IS DISTINCT FROM v_actor_id THEN
        RAISE EXCEPTION 'The authenticated counter must accept the verified transfer';
    END IF;
    IF NEW.received_by IS DISTINCT FROM (SELECT e.name FROM public.employees e WHERE e.id = v_actor_id) THEN
        RAISE EXCEPTION 'Receipt identity must match the authenticated counter';
    END IF;
    v_expected_count := jsonb_array_length(coalesce(v_check.final_counts, '[]'::jsonb));
    IF jsonb_typeof(NEW.line_items) <> 'array' OR jsonb_array_length(NEW.line_items) <> v_expected_count THEN
        RAISE EXCEPTION 'Received line items do not match the verified count';
    END IF;
    FOR v_actual, v_attested, v_actual_condition, v_attested_condition IN
        SELECT coalesce(nullif((NEW.line_items->(m.ordinality - 1))->>'receivedQty', '')::numeric, -1),
               coalesce(nullif((v_check.final_counts->(m.ordinality - 1))->>'receivedQty', '')::numeric, -2),
               coalesce((NEW.line_items->(m.ordinality - 1))->>'condition', 'Good'),
               coalesce((v_check.final_counts->(m.ordinality - 1))->>'condition', 'Good')
        FROM jsonb_array_elements(coalesce(NEW.line_items, '[]'::jsonb)) WITH ORDINALITY AS m(item, ordinality)
        ORDER BY m.ordinality
    LOOP
        IF v_actual IS DISTINCT FROM v_attested THEN RAISE EXCEPTION 'Received quantity differs from the verified count'; END IF;
        IF v_actual_condition IS DISTINCT FROM v_attested_condition THEN RAISE EXCEPTION 'Received condition differs from the verified count'; END IF;
        IF coalesce(NEW.line_items->v_index->>'productId', NEW.line_items->v_index->>'product_id', NEW.line_items->v_index->>'id', '')
           IS DISTINCT FROM coalesce(OLD.line_items->v_index->>'productId', OLD.line_items->v_index->>'product_id', OLD.line_items->v_index->>'id', '') THEN
            RAISE EXCEPTION 'Received product differs from the verified manifest';
        END IF;
        v_index := v_index + 1;
    END LOOP;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_transfer_receipt_verification() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_transfer_receipt_verification ON public.wms_jobs;
CREATE TRIGGER guard_transfer_receipt_verification
    BEFORE UPDATE ON public.wms_jobs
    FOR EACH ROW EXECUTE FUNCTION private.guard_transfer_receipt_verification();
