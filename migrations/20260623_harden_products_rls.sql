-- =============================================================================
-- SIIFMART: Security Hardening & Legitimate Access Matrix for Products Table
-- =============================================================================
--
-- WHAT THIS DOES:
--   1. Re-creates public.is_admin() to completely remove the legacy 'admin' role.
--   2. Creates public.get_my_employee_id() to mapping auth.uid() to employees.id.
--   3. Updates products RLS policies for INSERT and UPDATE.
--   4. Creates a BEFORE UPDATE trigger to enforce column-level write access:
--      • Price columns: Only CEO and Procurement staff can modify.
--      • Product Details columns: Only CEO and Regional Managers can modify.
--      • Operational columns: Only Managers or Workers with active job assignments can update.
--
-- Safe to re-run (idempotent).
-- =============================================================================

-- 1. Update is_admin() helper function to remove legacy 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (select public.get_my_role()) IN (
    'super_admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Create get_my_employee_id() mapping function
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.employees 
    WHERE id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Reset RLS policies on public.products
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;

-- RLS INSERT: Managers or Workers assigned to an active RECEIVE job
CREATE POLICY "products_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_manager())
        OR
        EXISTS (
            SELECT 1
            FROM public.job_assignments ja
            JOIN public.wms_jobs j ON j.id = ja.job_id
            WHERE ja.employee_id = public.get_my_employee_id()
              AND j.type = 'RECEIVE'
              AND j.status IN ('Pending', 'In Progress', 'Active')
        )
    );

-- RLS UPDATE: Enable row access for updates (details checked by trigger)
CREATE POLICY "products_update" ON public.products
    FOR UPDATE TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 4. Create trigger function to enforce column-level access controls
CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  emp_role TEXT;
  has_active_job BOOLEAN;
BEGIN
  -- Get current user's role
  emp_role := public.get_my_role();
  
  -- CEO (super_admin) has bypass for all checks
  IF emp_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- A. PRICE COLUMNS CHECK
  -- Columns: price, sale_price, cost_price, is_on_sale
  IF (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
      OLD.cost_price IS DISTINCT FROM NEW.cost_price OR
      OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale) THEN
      
      -- Only procurement_manager and procurement (staff) can modify pricing/cost
      IF emp_role NOT IN ('procurement_manager', 'procurement') THEN
          RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
      END IF;
  END IF;

  -- B. PRODUCT DETAILS COLUMNS CHECK
  -- Columns: name, sku, category, brand, size, unit, description, image, custom_attributes, min_stock, max_stock, pack_quantity
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
      
      -- Only regional_manager (CEO handled above) can modify details
      IF emp_role IS DISTINCT FROM 'regional_manager' THEN
          RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
      END IF;
  END IF;

  -- C. GENERAL UPDATE / OPERATIONAL ACCESS CHECK
  -- Requires manager status OR active job assignment
  IF NOT public.is_manager() THEN
      SELECT EXISTS (
          SELECT 1
          FROM public.job_assignments ja
          JOIN public.wms_jobs j ON j.id = ja.job_id
          WHERE ja.employee_id = public.get_my_employee_id()
            AND j.status IN ('Pending', 'In Progress', 'Active')
      ) INTO has_active_job;

      IF NOT has_active_job THEN
          RAISE EXCEPTION 'You do not have permission to update products (requires manager role or active job assignment).';
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Attach BEFORE UPDATE trigger to public.products
DROP TRIGGER IF EXISTS trg_enforce_product_update_restrictions ON public.products;
CREATE TRIGGER trg_enforce_product_update_restrictions
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_product_update_restrictions();

-- Output completion notice
DO $$
BEGIN
    RAISE NOTICE '✅ products security constraints & legacy admin removal complete.';
END $$;
