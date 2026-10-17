-- =============================================================================
-- Migration: Security Hardening for Products Stock and POS Cash Drops
-- Date: 2026-10-17
-- Description:
-- 1. Restrict products UPDATE: enforce site and regional boundaries; block direct
--    stock mutations outside approved inventory requests, WMS jobs, or POS transactions.
-- 2. Restrict pos_cash_drops: site-scoped SELECT/INSERT/UPDATE; verify supervisor identity,
--    role, and site alignment.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS: Site Scoping & Direct Stock Mutation Restriction
-- ─────────────────────────────────────────────────────────────────────────────

-- A. Update products_update RLS Policy
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
FOR UPDATE TO authenticated
USING (
    -- CEO / Super Admin can update any product
    public.is_ceo()
    OR (
        -- National HQ Admin can update products in their country
        public.is_admin()
        AND site_id IN (SELECT s.id FROM public.sites s WHERE s.country = public.get_my_country_code())
    )
    OR (
        -- Regional Managers can only update products at sites within their assigned region
        (SELECT public.get_my_role()) = 'regional_manager'
        AND site_id IN (
            SELECT s.id FROM public.sites s
            WHERE s.region_code = (
                SELECT e.region_code FROM public.employees e 
                WHERE e.id = (SELECT auth.uid()) OR e.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
                LIMIT 1
            )
        )
    )
    OR (
        -- Branch Managers (store_manager, warehouse_manager) can only update products at their assigned site
        public.is_manager()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id FROM public.sites s 
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
        )
    )
);

-- B. Enhance enforce_product_update_restrictions Trigger Function
CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  emp_role TEXT;
  emp_id UUID;
  has_active_job BOOLEAN;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF emp_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- 1. PRICE & COST RESTRICTION
  IF (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
      OLD.cost_price IS DISTINCT FROM NEW.cost_price OR
      OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale) THEN
      IF emp_role NOT IN ('procurement_manager', 'procurement', 'CEO', 'ceo') THEN
          RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
      END IF;
  END IF;

  -- 2. PRODUCT MASTER DETAILS RESTRICTION
  IF (OLD.name IS DISTINCT FROM NEW.name OR
      OLD.sku IS DISTINCT FROM NEW.sku OR
      OLD.category IS DISTINCT FROM NEW.category OR
      OLD.brand IS DISTINCT FROM NEW.brand OR
      OLD.size IS DISTINCT FROM NEW.size OR
      OLD.unit IS DISTINCT FROM NEW.unit OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.image IS DISTINCT FROM NEW.image OR
      OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR
      OLD.min_stock IS DISTINCT FROM NEW.min_stock OR
      OLD.max_stock IS DISTINCT FROM NEW.max_stock OR
      OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity) THEN
      IF emp_role NOT IN ('regional_manager', 'super_admin', 'CEO', 'ceo', 'admin') THEN
          RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
      END IF;
  END IF;

  -- 3. STOCK MODIFICATION ZERO-TRUST RESTRICTION
  -- Branch staff cannot arbitrarily mutate stock directly. Stock adjustments require
  -- HQ-approved inventory requests, active WMS task fulfillment, or POS transactions.
  IF (OLD.stock IS DISTINCT FROM NEW.stock) THEN
      IF emp_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'inventory_controller', 'supply_chain_director') THEN
          -- HQ roles permitted
          NULL;
      ELSE
          -- Check if updater has an active WMS job for this site
          SELECT EXISTS (
              SELECT 1
              FROM public.job_assignments ja
              JOIN public.wms_jobs j ON j.id = ja.job_id
              WHERE ja.employee_id = emp_id
                AND (j.site_id::text = OLD.site_id::text OR j.dest_site_id::text = OLD.site_id::text)
                AND j.status IN ('Pending', 'In Progress', 'Active', 'In-Progress')
          ) INTO has_active_job;

          -- Also allow store managers executing local POS receiving or approved inventory requests
          IF NOT has_active_job AND emp_role NOT IN ('store_manager', 'warehouse_manager', 'operations_manager') THEN
              RAISE EXCEPTION 'Direct stock modification is prohibited. Stock adjustments must be submitted via Inventory Requests for approval or processed via active WMS jobs.';
          END IF;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trg_enforce_product_update_restrictions ON public.products;
CREATE TRIGGER trg_enforce_product_update_restrictions
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_product_update_restrictions();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. POS CASH DROPS: Site Scoping, Role Check & Supervisor Verification
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_pos_cash_drop_custody()
RETURNS TRIGGER AS $$
DECLARE
    v_supervisor RECORD;
BEGIN
    -- 1. Dual Control Check: Cashier and Supervisor cannot be the same person
    IF NEW.cashier_id = NEW.supervisor_id THEN
        RAISE EXCEPTION 'Dual Control Violation: Cashier cannot supervise their own cash drop.';
    END IF;

    -- 2. Verify Supervisor exists and is active in employees
    SELECT id, name, role, site_id, country, status
    INTO v_supervisor
    FROM public.employees
    WHERE id::text = NEW.supervisor_id
       OR code = NEW.supervisor_id
    LIMIT 1;

    IF v_supervisor.id IS NULL THEN
        RAISE EXCEPTION 'Custody Verification Failed: Supervisor profile not found in employee records.';
    END IF;

    IF v_supervisor.status IS NOT NULL AND LOWER(v_supervisor.status) != 'active' THEN
        RAISE EXCEPTION 'Custody Verification Failed: Supervisor employee account is inactive.';
    END IF;

    -- 3. Verify Supervisor has an authorized supervisory role
    IF LOWER(v_supervisor.role) NOT IN (
        'super_admin', 'ceo', 'admin', 'store_manager', 'warehouse_manager', 
        'operations_manager', 'regional_manager', 'supervisor', 'shift_lead', 'assistant_manager'
    ) THEN
        RAISE EXCEPTION 'Custody Verification Failed: Role "%" is not authorized to supervise cash drops.', v_supervisor.role;
    END IF;

    -- 4. Verify Supervisor belongs to the same site (or is a regional/HQ authority)
    IF LOWER(v_supervisor.role) NOT IN ('super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager') THEN
        IF v_supervisor.site_id IS NOT NULL AND NEW.site_id IS NOT NULL AND v_supervisor.site_id::text != NEW.site_id::text THEN
            RAISE EXCEPTION 'Cross-Site Custody Violation: Supervisor belongs to site "%", not drop site "%".', v_supervisor.site_id, NEW.site_id;
        END IF;
    END IF;

    -- Enforce verified supervisor details on the record
    NEW.supervisor_name := COALESCE(v_supervisor.name, NEW.supervisor_name);
    NEW.supervisor_role := v_supervisor.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_pos_cash_drop_custody ON public.pos_cash_drops;
CREATE TRIGGER trg_validate_pos_cash_drop_custody
    BEFORE INSERT OR UPDATE ON public.pos_cash_drops
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_pos_cash_drop_custody();

DROP POLICY IF EXISTS "pos_cash_drops_read" ON public.pos_cash_drops;
CREATE POLICY "pos_cash_drops_read" ON public.pos_cash_drops
FOR SELECT TO authenticated
USING (
    public.is_ceo()
    OR (
        public.is_admin()
        AND country_code = public.get_my_country_code()
    )
    OR (
        (SELECT public.get_my_role()) = 'regional_manager'
        AND site_id IN (
            SELECT s.id::text FROM public.sites s
            WHERE s.region_code = (
                SELECT e.region_code FROM public.employees e 
                WHERE e.id = (SELECT auth.uid()) OR e.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
                LIMIT 1
            )
        )
    )
    OR (
        country_code = public.get_my_country_code()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id::text FROM public.sites s 
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
        )
    )
);

DROP POLICY IF EXISTS "pos_cash_drops_insert" ON public.pos_cash_drops;
CREATE POLICY "pos_cash_drops_insert" ON public.pos_cash_drops
FOR INSERT TO authenticated
WITH CHECK (
    public.is_ceo()
    OR (
        country_code = public.get_my_country_code()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id::text FROM public.sites s 
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
            OR public.is_admin()
        )
    )
);

DROP POLICY IF EXISTS "pos_cash_drops_update" ON public.pos_cash_drops;
CREATE POLICY "pos_cash_drops_update" ON public.pos_cash_drops
FOR UPDATE TO authenticated
USING (
    public.is_ceo()
    OR (
        public.is_admin()
        AND country_code = public.get_my_country_code()
    )
    OR (
        public.is_manager()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id::text FROM public.sites s 
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
        )
    )
);
