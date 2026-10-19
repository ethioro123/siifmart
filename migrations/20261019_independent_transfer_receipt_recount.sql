CREATE TABLE IF NOT EXISTS public.transfer_receipt_verifications (
    job_id uuid PRIMARY KEY REFERENCES public.wms_jobs(id) ON DELETE CASCADE,
    site_id uuid NOT NULL REFERENCES public.sites(id),
    country_code varchar(10) NOT NULL,
    status text NOT NULL DEFAULT 'awaiting_first_count'
        CHECK (status IN ('awaiting_first_count', 'awaiting_recount', 'verified')),
    first_counts jsonb,
    first_counter_id uuid REFERENCES public.employees(id),
    first_counted_at timestamptz,
    second_counts jsonb,
    second_counter_id uuid REFERENCES public.employees(id),
    second_counted_at timestamptz,
    final_counts jsonb,
    has_discrepancy boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfer_receipt_verifications_site_status
    ON public.transfer_receipt_verifications (country_code, site_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS transfer_receipt_verifications_site
    ON public.transfer_receipt_verifications (site_id);
CREATE INDEX IF NOT EXISTS transfer_receipt_verifications_first_counter
    ON public.transfer_receipt_verifications (first_counter_id);
CREATE INDEX IF NOT EXISTS transfer_receipt_verifications_second_counter
    ON public.transfer_receipt_verifications (second_counter_id);

ALTER TABLE public.transfer_receipt_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transfer_receipt_verifications FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.transfer_receipt_verifications TO service_role;

CREATE OR REPLACE FUNCTION public.get_transfer_receipt_verification(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_actor_id uuid := public.get_my_employee_id();
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_job public.wms_jobs%ROWTYPE;
    v_check public.transfer_receipt_verifications%ROWTYPE;
    v_items jsonb;
    v_can_count boolean;
BEGIN
    IF auth.uid() IS NULL OR v_actor_id IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
    IF v_role NOT IN ('receiver', 'store_manager', 'warehouse_manager', 'inventory_manager', 'regional_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'This employee role cannot verify transfer receipt';
    END IF;

    SELECT * INTO v_job FROM public.wms_jobs j
     WHERE j.id = p_job_id AND j.type = 'TRANSFER'
       AND j.transfer_status IN ('Delivered', 'Partially Delivered')
       AND public.is_site_in_my_authorized_scope(j.dest_site_id::text, j.country_code);
    IF NOT FOUND THEN RAISE EXCEPTION 'Transfer is not awaiting receipt at this employee site'; END IF;

    SELECT * INTO v_check FROM public.transfer_receipt_verifications c WHERE c.job_id = p_job_id;
    IF NOT FOUND THEN
        v_can_count := true;
        v_items := coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                'index', item.ordinality - 1,
                'productId', coalesce(item.value->>'productId', item.value->>'product_id', item.value->>'id'),
                'name', coalesce(item.value->>'name', item.value->>'productName', item.value->>'product_name', 'Item'),
                'sku', coalesce(item.value->>'sku', ''),
                'unit', coalesce(item.value->>'unit', 'pcs'),
                'size', coalesce(item.value->>'size', ''),
                'packQuantity', item.value->'packQuantity',
                'packageType', item.value->'packageType',
                'barcode', coalesce(item.value->>'barcode', ''),
                'condition', 'Good',
                'receivedQty', 0
            ) ORDER BY item.ordinality)
            FROM jsonb_array_elements(coalesce(v_job.line_items, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality)
        ), '[]'::jsonb);
        RETURN jsonb_build_object('status', 'awaiting_first_count', 'canCount', v_can_count, 'items', v_items);
    END IF;

    v_can_count := CASE
        WHEN v_check.status = 'awaiting_first_count' THEN v_actor_id = v_check.first_counter_id OR v_check.first_counter_id IS NULL
        WHEN v_check.status = 'awaiting_recount' THEN v_actor_id IS DISTINCT FROM v_check.first_counter_id
        ELSE false
    END;
    v_items := coalesce((
        SELECT jsonb_agg(jsonb_build_object(
            'index', item.ordinality - 1,
            'productId', coalesce(item.value->>'productId', item.value->>'product_id', item.value->>'id'),
            'name', coalesce(item.value->>'name', item.value->>'productName', item.value->>'product_name', 'Item'),
            'sku', coalesce(item.value->>'sku', ''),
            'unit', coalesce(item.value->>'unit', 'pcs'),
            'size', coalesce(item.value->>'size', ''),
            'packQuantity', item.value->'packQuantity',
            'packageType', item.value->'packageType',
            'barcode', coalesce(item.value->>'barcode', ''),
            'condition', CASE WHEN v_check.status = 'verified' THEN coalesce(v_check.final_counts->(item.ordinality - 1)->>'condition', 'Good') ELSE 'Good' END,
            'receivedQty', CASE WHEN v_check.status = 'verified' THEN ((v_check.final_counts->(item.ordinality - 1))->>'receivedQty')::numeric ELSE 0 END
        ) ORDER BY item.ordinality)
        FROM jsonb_array_elements(coalesce(v_job.line_items, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality)
    ), '[]'::jsonb);

    RETURN jsonb_build_object(
        'status', v_check.status,
        'canCount', v_can_count,
        'hasDiscrepancy', v_check.has_discrepancy,
        'firstCounterId', v_check.first_counter_id,
        'secondCounterId', v_check.second_counter_id,
        'items', v_items
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_transfer_receipt_count(p_job_id uuid, p_counts jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_actor_id uuid := public.get_my_employee_id();
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_job public.wms_jobs%ROWTYPE;
    v_check public.transfer_receipt_verifications%ROWTYPE;
    v_actor public.employees%ROWTYPE;
    v_expected numeric;
    v_received numeric;
    v_first_received numeric;
    v_index integer := 0;
    v_has_variance boolean := false;
    v_first_variance boolean := false;
    v_status text;
    v_expected_count integer;
BEGIN
    IF auth.uid() IS NULL OR v_actor_id IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
    IF v_role NOT IN ('receiver', 'store_manager', 'warehouse_manager', 'inventory_manager', 'regional_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'This employee role cannot verify transfer receipt';
    END IF;
    IF jsonb_typeof(p_counts) <> 'array' THEN RAISE EXCEPTION 'A complete count list is required'; END IF;

    SELECT * INTO v_job FROM public.wms_jobs j
     WHERE j.id = p_job_id AND j.type = 'TRANSFER'
       AND j.transfer_status IN ('Delivered', 'Partially Delivered')
       AND public.is_site_in_my_authorized_scope(j.dest_site_id::text, j.country_code)
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Transfer is not awaiting receipt at this employee site'; END IF;

    SELECT * INTO v_actor FROM public.employees e WHERE e.id = v_actor_id AND lower(coalesce(e.status, 'active')) = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Active employee required'; END IF;
    v_expected_count := jsonb_array_length(coalesce(v_job.line_items, '[]'::jsonb));
    IF v_expected_count = 0 OR jsonb_array_length(p_counts) <> v_expected_count THEN
        RAISE EXCEPTION 'Count every transfer line before submitting';
    END IF;

    SELECT * INTO v_check FROM public.transfer_receipt_verifications c WHERE c.job_id = p_job_id FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.transfer_receipt_verifications(job_id, site_id, country_code, first_counter_id)
        VALUES (p_job_id, v_job.dest_site_id, upper(v_job.country_code), v_actor_id)
        RETURNING * INTO v_check;
    END IF;

    IF v_check.status = 'awaiting_first_count' AND v_check.first_counter_id IS DISTINCT FROM v_actor_id THEN
        RAISE EXCEPTION 'The employee who started the count must finish it';
    ELSIF v_check.status = 'awaiting_recount' AND v_check.first_counter_id = v_actor_id THEN
        RAISE EXCEPTION 'A different authenticated destination employee must recount this transfer';
    ELSIF v_check.status = 'verified' THEN
        RAISE EXCEPTION 'Transfer receipt verification is already complete';
    END IF;

    FOR v_expected, v_received IN
        SELECT
            coalesce(nullif(coalesce(m.item->>'dispatchedQty', m.item->>'shippedQty', m.item->>'packedQty', m.item->>'pickedQty', m.item->>'expectedQty', m.item->>'quantity'), '')::numeric, 0),
            coalesce(nullif(c.item->>'receivedQty', '')::numeric, -1)
        FROM jsonb_array_elements(coalesce(v_job.line_items, '[]'::jsonb)) WITH ORDINALITY AS m(item, ordinality)
        JOIN jsonb_array_elements(p_counts) WITH ORDINALITY AS c(item, ordinality) USING (ordinality)
        ORDER BY m.ordinality
    LOOP
        IF v_received < 0 OR v_received > 100000000 THEN RAISE EXCEPTION 'Enter a valid non-negative received quantity'; END IF;
        IF coalesce(p_counts->v_index->>'index', v_index::text)::integer <> v_index THEN RAISE EXCEPTION 'Count list order is invalid'; END IF;
        IF coalesce(p_counts->v_index->>'productId', '') <> coalesce(v_job.line_items->v_index->>'productId', v_job.line_items->v_index->>'product_id', v_job.line_items->v_index->>'id', '') THEN
            RAISE EXCEPTION 'Counted product does not match the transfer manifest';
        END IF;
        IF coalesce(p_counts->v_index->>'condition', 'Good') NOT IN ('Good', 'Damaged', 'Short') THEN RAISE EXCEPTION 'Invalid received condition'; END IF;
        v_has_variance := v_has_variance OR v_received IS DISTINCT FROM v_expected OR coalesce(p_counts->v_index->>'condition', 'Good') <> 'Good';
        IF v_check.status = 'awaiting_recount' THEN
            v_first_received := coalesce(nullif(v_check.first_counts->v_index->>'receivedQty', '')::numeric, -1);
            v_first_variance := v_first_variance OR v_received IS DISTINCT FROM v_first_received
                OR coalesce(p_counts->v_index->>'condition', 'Good') IS DISTINCT FROM coalesce(v_check.first_counts->v_index->>'condition', 'Good');
        END IF;
        v_index := v_index + 1;
    END LOOP;

    IF v_check.status = 'awaiting_first_count' THEN
        IF v_has_variance THEN
            v_status := 'awaiting_recount';
            UPDATE public.transfer_receipt_verifications
               SET status = v_status, first_counts = p_counts, first_counter_id = v_actor_id,
                   first_counted_at = now(), has_discrepancy = true, updated_at = now()
             WHERE job_id = p_job_id;
        ELSE
            v_status := 'verified';
            UPDATE public.transfer_receipt_verifications
               SET status = v_status, first_counts = p_counts, first_counter_id = v_actor_id,
                   first_counted_at = now(), final_counts = p_counts, has_discrepancy = false, updated_at = now()
             WHERE job_id = p_job_id;
        END IF;
    ELSE
        v_status := 'verified';
        UPDATE public.transfer_receipt_verifications
           SET status = v_status, second_counts = p_counts, second_counter_id = v_actor_id,
               second_counted_at = now(), final_counts = p_counts,
               has_discrepancy = v_has_variance OR v_first_variance, updated_at = now()
         WHERE job_id = p_job_id;
    END IF;

    RETURN jsonb_build_object('status', v_status,
        'canCount', false,
        'hasDiscrepancy', CASE WHEN v_check.status = 'awaiting_recount' THEN v_has_variance OR v_first_variance ELSE v_has_variance END,
        'counterId', v_actor_id,
        'items', p_counts);
END;
$function$;

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
    FOR v_actual, v_attested IN
        SELECT coalesce(nullif((NEW.line_items->(m.ordinality - 1))->>'receivedQty', '')::numeric, -1),
               coalesce(nullif((v_check.final_counts->(m.ordinality - 1))->>'receivedQty', '')::numeric, -2)
        FROM jsonb_array_elements(coalesce(NEW.line_items, '[]'::jsonb)) WITH ORDINALITY AS m(item, ordinality)
        ORDER BY m.ordinality
    LOOP
        IF v_actual IS DISTINCT FROM v_attested THEN RAISE EXCEPTION 'Received quantity differs from the verified count'; END IF;
        IF coalesce(NEW.line_items->v_index->>'productId', NEW.line_items->v_index->>'product_id', NEW.line_items->v_index->>'id', '')
           IS DISTINCT FROM coalesce(OLD.line_items->v_index->>'productId', OLD.line_items->v_index->>'product_id', OLD.line_items->v_index->>'id', '') THEN
            RAISE EXCEPTION 'Received product differs from the verified manifest';
        END IF;
        v_index := v_index + 1;
    END LOOP;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_transfer_receipt_verification(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_transfer_receipt_count(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_transfer_receipt_verification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_transfer_receipt_count(uuid, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION private.guard_transfer_receipt_verification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_transfer_receipt_verification ON public.wms_jobs;
CREATE TRIGGER guard_transfer_receipt_verification
    BEFORE UPDATE ON public.wms_jobs
    FOR EACH ROW EXECUTE FUNCTION private.guard_transfer_receipt_verification();
