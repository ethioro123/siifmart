-- ============================================================================
-- Migration: 20261028_calibrate_operating_expense_limits.sql
-- Description: Phase 3 Delegated Governance: Operating Expenses & Treasury
--              Calibrates autonomous operating expense limits:
--              1. Regional Autonomous Limit: 2,000,000 ETB / KES
--                 (Approved by Regional Ops Manager or Regional Finance Manager)
--              2. Country Autonomous Limit: 20,000,000 ETB / KES
--                 (Approved by Country Finance Director or Country MD)
--              3. Sovereign Escalation: > 20,000,000 ETB / KES
--                 (Auto-escalated to Group CFO / Group CEO)
--              4. Zero Self-Approval (Maker-Checker segregation for all roles)
--              5. Multi-Country Sovereignty & Isolation (No cross-border approvals)
-- ============================================================================

-- 1. Create public.country_governance_limits if not exists
CREATE TABLE IF NOT EXISTS public.country_governance_limits (
    country_code VARCHAR(10) PRIMARY KEY,
    po_regional_default_limit NUMERIC(14, 2) NOT NULL DEFAULT 10000000.00,
    po_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 100000000.00,
    expense_regional_limit NUMERIC(14, 2) NOT NULL DEFAULT 2000000.00,
    expense_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000000.00,
    headcount_country_buffer INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.country_governance_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'country_governance_limits' 
          AND policyname = 'country_governance_limits_read_policy'
    ) THEN
        CREATE POLICY country_governance_limits_read_policy 
            ON public.country_governance_limits 
            FOR SELECT 
            TO authenticated 
            USING (true);
    END IF;
END $$;

-- 2. Seed default country operating expense limits for ET and KE
INSERT INTO public.country_governance_limits (
    country_code,
    po_regional_default_limit,
    po_country_limit,
    expense_regional_limit,
    expense_country_limit,
    headcount_country_buffer
) VALUES 
    ('ET', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10),
    ('KE', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10)
ON CONFLICT (country_code) DO UPDATE SET
    expense_regional_limit = EXCLUDED.expense_regional_limit,
    expense_country_limit = EXCLUDED.expense_country_limit,
    updated_at = now();

-- 3. Calibrate system_config expense approval limit to 20,000,000 ETB / KES
UPDATE public.system_config
SET expense_approval_limit = 20000000.00
WHERE id = '00000000-0000-0000-0000-000000000001' OR expense_approval_limit IS NOT NULL;

-- 4. Calibrate regions autonomous expense limit to 2,000,000 ETB / KES
ALTER TABLE public.regions
    ALTER COLUMN autonomous_expense_limit SET DEFAULT 2000000.00;

UPDATE public.regions
SET autonomous_expense_limit = 2000000.00;

-- 5. De-escalate false legacy escalations on pending expenses <= 20,000,000 ETB / KES
UPDATE public.expenses
SET escalated_to_ceo = false,
    escalation_reason = null
WHERE amount <= 20000000.00
  AND status = 'Pending'
  AND escalated_to_ceo = true
  AND (escalation_reason ILIKE '%threshold%' OR escalation_reason ILIKE '%sovereign%' OR escalation_reason IS NULL);

-- 6. Upgraded Server-Side RPC: Zero-Trust 3-Tier Expense Approval
CREATE OR REPLACE FUNCTION public.approve_expense(
    p_expense_id uuid,
    p_approver_id text,
    p_approver_name text,
    p_approver_role text,
    p_notes text DEFAULT ''::text,
    p_approver_country text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_expense RECORD;
    v_region_code TEXT;
    v_country_code TEXT;
    v_approver_country TEXT;
    v_regional_limit NUMERIC := 2000000.00;
    v_country_limit NUMERIC := 20000000.00;
    v_norm_role TEXT;
    v_raw_role TEXT;
    v_is_group_exec BOOLEAN := false;
    v_is_country_lead BOOLEAN := false;
    v_is_regional_mgr BOOLEAN := false;
    v_approver_uuid UUID;
BEGIN
    -- 1. Fetch Expense
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense % not found', p_expense_id;
    END IF;

    -- 2. Status Guard: Must be Pending
    IF v_expense.status != 'Pending' THEN
        RAISE EXCEPTION 'Expense cannot be approved from current status "%"', v_expense.status;
    END IF;

    -- 3. Resolve Approver Role and Roles Classification
    v_raw_role := lower(trim(coalesce(p_approver_role, '')));
    v_norm_role := public.normalize_role(p_approver_role);

    -- Group Executive Tier (Level 4/5): > 20M ETB/KES
    v_is_group_exec := v_norm_role IN ('super_admin', 'ceo', 'group_ceo', 'cfo', 'group_cfo') 
                       OR v_raw_role IN ('group_ceo', 'group_cfo', 'cfo', 'super_admin');

    -- Country Leadership Tier (Level 2/3): 2M to 20M ETB/KES
    v_is_country_lead := v_is_group_exec OR v_norm_role IN (
        'country_finance_director', 'country_managing_director', 
        'country_operations_director', 'finance_manager', 'managing_director'
    ) OR v_raw_role IN (
        'country_finance_director', 'country_managing_director', 
        'country_operations_director', 'finance_manager', 'managing_director'
    );

    -- Regional Leadership Tier (Level 1): <= 2M ETB/KES
    v_is_regional_mgr := v_is_country_lead OR v_norm_role IN (
        'regional_operations_manager', 'regional_finance_manager', 'regional_manager'
    ) OR v_raw_role IN (
        'regional_operations_manager', 'regional_finance_manager', 'regional_manager'
    );

    -- Unauthorized Floor / Store Roles Check
    IF NOT v_is_regional_mgr THEN
        RAISE EXCEPTION 'Role "%" is not authorized to approve operating expenses.', p_approver_role;
    END IF;

    -- 4. Safe UUID cast
    BEGIN
        v_approver_uuid := p_approver_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_approver_uuid := NULL;
    END;

    -- 5. ZERO SELF-APPROVAL INVARIANT (Maker-Checker segregation - absolute, no exceptions for CEO)
    IF (v_expense.created_by_id IS NOT NULL AND v_expense.created_by_id::text = p_approver_id::text)
       OR (v_expense.created_by_name IS NOT NULL AND LOWER(TRIM(v_expense.created_by_name)) = LOWER(TRIM(p_approver_name)))
    THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Expense creator cannot approve their own expense (Zero Self-Approval).';
    END IF;

    -- 6. MULTI-COUNTRY SOVEREIGNTY & ISOLATION
    v_country_code := COALESCE(v_expense.country_code, 'ET');
    v_approver_country := upper(trim(coalesce(p_approver_country, '')));

    -- If not passed explicitly, attempt lookup from employees / sites / regions
    IF v_approver_country IS NULL OR v_approver_country = '' THEN
        SELECT COALESCE(s.country, r.country) INTO v_approver_country
        FROM public.employees e
        LEFT JOIN public.sites s ON s.id = e.site_id
        LEFT JOIN public.regions r ON r.code = e.region_code
        WHERE e.id::text = p_approver_id OR e.code = p_approver_id
        LIMIT 1;
    END IF;

    -- Non-group approvers are strictly locked to their country
    IF NOT v_is_group_exec AND v_approver_country IS NOT NULL AND v_approver_country != '' THEN
        IF v_approver_country != v_country_code THEN
            RAISE EXCEPTION 'Country Isolation Violation: Approver from % cannot approve expenses in %. Cross-border approvals are strictly prohibited.',
                v_approver_country, v_country_code;
        END IF;
    END IF;

    -- 7. RESOLVE BOUNDARIES FROM REGIONS / COUNTRY GOVERNANCE LIMITS
    v_region_code := v_expense.region_code;
    IF v_region_code IS NULL AND v_expense.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_expense.site_id;
    END IF;

    -- Regional Autonomous Limit (default 2,000,000)
    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_expense_limit, 2000000.00) INTO v_regional_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    -- Country Autonomous Limit (default 20,000,000)
    SELECT COALESCE(cgl.expense_country_limit, 20000000.00) INTO v_country_limit
    FROM public.country_governance_limits cgl
    WHERE cgl.country_code = v_country_code;
    IF v_country_limit IS NULL THEN
        v_country_limit := 20000000.00;
    END IF;

    -- 8. TIER 3 BOUNDARY: Operating expenses > 20,000,000 ETB / KES
    -- Escalate to Group CFO / Group CEO
    IF COALESCE(v_expense.amount, 0) > v_country_limit OR v_expense.escalated_to_ceo IS TRUE THEN
        IF NOT v_is_group_exec THEN
            RAISE EXCEPTION 'Executive Authorization Required: Expense amount (% %) exceeds country autonomous limit of % %. Requires Group CFO or Group CEO approval.',
                v_country_code, v_expense.amount, v_country_code, v_country_limit;
        END IF;
    END IF;

    -- 9. TIER 2 BOUNDARY: Operating expenses between 2,000,000 and 20,000,000 ETB / KES
    -- Must be approved by Country Finance Director or Country Managing Director
    IF COALESCE(v_expense.amount, 0) > v_regional_limit THEN
        IF NOT v_is_country_lead THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Expense amount (% %) exceeds regional autonomous limit of % %. Requires Country Finance Director or Country Managing Director sign-off.',
                v_country_code, v_expense.amount, v_country_code, v_regional_limit;
        END IF;
    END IF;

    -- 10. Execute approval transition
    UPDATE public.expenses
    SET status = 'Approved',
        approved_by = p_approver_name,
        approved_by_id = v_approver_uuid,
        approved_at = NOW(),
        hq_approved_by = CASE WHEN (v_is_group_exec OR v_is_country_lead) THEN p_approver_name ELSE v_expense.hq_approved_by END,
        hq_approved_at = CASE WHEN (v_is_group_exec OR v_is_country_lead) THEN NOW() ELSE v_expense.hq_approved_at END,
        updated_at = NOW()
    WHERE id = p_expense_id;

    RETURN jsonb_build_object(
        'success', true,
        'expense_id', p_expense_id,
        'approved_by', p_approver_name,
        'status', 'Approved',
        'is_group_executive', v_is_group_exec,
        'is_country_lead', v_is_country_lead,
        'amount', v_expense.amount
    );
END;
$function$;
