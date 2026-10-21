-- Migration: Authorize Country Managing Director on escalated expenses
-- Applied to supabase-staging per Rule 9

CREATE OR REPLACE FUNCTION public.approve_expense(
    p_expense_id uuid,
    p_approver_id text,
    p_approver_name text,
    p_approver_role text,
    p_notes text DEFAULT ''::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_expense RECORD;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 35000.00;
    v_norm_role TEXT;
    v_raw_role TEXT;
    v_is_ceo BOOLEAN := false;
    v_is_regional BOOLEAN := false;
    v_approver_uuid UUID;
BEGIN
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense % not found', p_expense_id;
    END IF;

    IF v_expense.status != 'Pending' THEN
        RAISE EXCEPTION 'Expense cannot be approved from current status "%"', v_expense.status;
    END IF;

    v_raw_role := lower(trim(coalesce(p_approver_role, '')));
    v_norm_role := public.normalize_role(p_approver_role);
    v_is_ceo := v_norm_role IN ('super_admin', 'ceo') OR v_raw_role IN ('country_managing_director', 'admin');

    -- Safe UUID cast
    BEGIN
        v_approver_uuid := p_approver_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_approver_uuid := NULL;
    END;

    -- Strict Maker-Checker segregation
    IF NOT v_is_ceo AND (
        (v_expense.created_by_id IS NOT NULL AND v_expense.created_by_id::text = p_approver_id::text)
        OR (v_expense.created_by_name IS NOT NULL AND LOWER(TRIM(v_expense.created_by_name)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Expense creator cannot approve their own expense (4-Eyes Principle).';
    END IF;

    -- Executive escalation ceiling
    IF v_expense.escalated_to_ceo IS TRUE AND NOT v_is_ceo THEN
        RAISE EXCEPTION 'Executive Authorization Required: This expense exceeds the sovereign threshold and requires CEO approval.';
    END IF;

    -- Resolve region code
    v_region_code := v_expense.region_code;
    IF v_region_code IS NULL AND v_expense.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_expense.site_id;
    END IF;

    -- Resolve regional autonomous limit
    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_expense_limit, 35000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    -- Enforce autonomous cap for regional roles
    v_is_regional := v_norm_role IN ('regional_manager', 'regional_finance_officer');
    IF v_is_regional AND NOT v_is_ceo AND v_norm_role NOT IN ('finance_manager', 'cfo', 'admin') THEN
        IF COALESCE(v_expense.amount, 0) > v_autonomous_limit THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Expense amount (% %) exceeds region % autonomous limit of % %. Requires National HQ sign-off.',
                v_expense.country_code, v_expense.amount, COALESCE(v_region_code, 'territory'), v_expense.country_code, v_autonomous_limit;
        END IF;
    END IF;

    -- Execute approval transition (using exact schema columns)
    UPDATE public.expenses
    SET status = 'Approved',
        approved_by = p_approver_name,
        approved_by_id = v_approver_uuid,
        approved_at = NOW(),
        hq_approved_by = CASE WHEN v_is_ceo THEN p_approver_name ELSE v_expense.hq_approved_by END,
        hq_approved_at = CASE WHEN v_is_ceo THEN NOW() ELSE v_expense.hq_approved_at END,
        updated_at = NOW()
    WHERE id = p_expense_id;

    RETURN jsonb_build_object(
        'success', true,
        'expense_id', p_expense_id,
        'approved_by', p_approver_name,
        'status', 'Approved',
        'is_regional_autonomous', v_is_regional,
        'amount', v_expense.amount
    );
END;
$function$;
