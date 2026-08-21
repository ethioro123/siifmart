-- =============================================================================
-- SIIFMART: Fix products INSERT RLS + Warehouse worker cross-functional access
-- =============================================================================
--
-- BUSINESS RULE: All warehouse workers (receiver, packer, picker, driver,
-- dispatcher, inventory_specialist, forklift_operator) are interchangeable
-- and can complete any warehouse job type (RECEIVE, PUTAWAY, PICK, PACK, etc.)
--
-- FIX 1: products_insert — Allow any authenticated user to create products
--         (previously only allowed RECEIVE-job-assigned workers)
-- FIX 2: products_update — Allow any authenticated user to update products
--         (stock, location, barcode updates happen across all job types)
-- FIX 3: enforce_product_update_restrictions trigger — Allow all warehouse
--         workers to update operational product fields (location, stock, barcodes)
--
-- Safe to re-run (idempotent).
-- =============================================================================

-- ── FIX 1: INSERT ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_insert" ON public.products;

CREATE POLICY "products_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
    );

-- ── FIX 2: UPDATE ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_update" ON public.products;

CREATE POLICY "products_update" ON public.products
    FOR UPDATE TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- ── FIX 3: UPDATE TRIGGER — allow all warehouse roles ────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  emp_role TEXT;
  has_active_job BOOLEAN;
BEGIN
  emp_role := public.get_my_role();

  -- Super admin / admin bypass everything
  IF emp_role IN ('super_admin', 'admin') THEN
    RETURN NEW;
  END IF;

  -- A. PRICE COLUMNS CHECK
  -- Only pricing-authorized roles can change price, sale_price, cost_price, is_on_sale
  IF (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
      OLD.cost_price IS DISTINCT FROM NEW.cost_price OR
      OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale) THEN
      IF emp_role NOT IN (
          'procurement_manager', 'procurement',
          'warehouse_manager', 'store_manager',
          'inventory_manager', 'operations_manager', 'regional_manager'
      ) THEN
          RAISE EXCEPTION 'Only authorized managers and procurement staff can modify product pricing or cost fields.';
      END IF;
  END IF;

  -- B. PRODUCT DETAILS COLUMNS CHECK
  -- Managers + all warehouse operations staff can sync product details during receiving/putaway
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
      IF emp_role NOT IN (
          'regional_manager', 'operations_manager', 'warehouse_manager',
          'store_manager', 'inventory_manager', 'procurement_manager', 'procurement',
          -- All cross-functional warehouse roles can sync product details
          'receiver', 'picker', 'packer', 'driver', 'dispatcher',
          'inventory_specialist', 'forklift_operator'
      ) THEN
          RAISE EXCEPTION 'Only authorized managers and warehouse staff can edit product details.';
      END IF;
  END IF;

  -- C. GENERAL UPDATE ACCESS
  -- All managers and warehouse operational staff can update operational fields
  -- (location, stock, barcode, status, expiry_date, batch_number etc.)
  IF NOT public.is_manager() AND emp_role NOT IN (
      'receiver', 'picker', 'packer', 'driver', 'dispatcher',
      'inventory_specialist', 'forklift_operator', 'warehouse_staff', 'cashier'
  ) THEN
      SELECT EXISTS (
          SELECT 1
          FROM public.job_assignments ja
          JOIN public.wms_jobs j ON j.id = ja.job_id
          WHERE (ja.employee_id = public.get_my_employee_id() OR j.assigned_to = public.get_my_employee_id()::text)
            AND j.status IN ('Pending', 'In Progress', 'Active')
      ) INTO has_active_job;

      IF NOT has_active_job THEN
          RAISE EXCEPTION 'You do not have permission to update products (requires manager role or active job assignment).';
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

DO $$
BEGIN
    RAISE NOTICE '✅ products INSERT + UPDATE policies opened to all authenticated users.';
    RAISE NOTICE '✅ Product update trigger updated: all warehouse roles can sync product details.';
    RAISE NOTICE '   Price fields: managers + procurement only.';
    RAISE NOTICE '   Operational fields: any active job assignment.';
END $$;
