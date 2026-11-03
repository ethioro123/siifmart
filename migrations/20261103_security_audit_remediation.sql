-- =============================================================================
-- Migration: 20261103_security_audit_remediation.sql
-- Description: Remediate 7 security and data integrity audit findings:
--   1. Storage avatars RLS: Active employee status & ownership enforcement
--   2. Deactivated accounts: get_my_role & session role helpers reject inactive employees
--   3. Product deletion: Prevent severing audit references; guard product delete evidence
--   4. Warehouse assignment history: Port retain_floor_stage_history triggers to production
--   5. PO receiving evidence: Check received_qty <= 0 on po_items delete
--   6. Employee documents: Disallow client hard deletion of personnel records
--   7. Excessive DB privileges: Revoke TRUNCATE on all public tables from anon/authenticated
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Finding 7: Excessive database privileges (Revoke TRUNCATE)
-- -----------------------------------------------------------------------------
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- Finding 2: Deactivated accounts (Harden get_my_role & site/region helpers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_uid UUID;
  v_email TEXT;
  v_status TEXT;
BEGIN
  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Primary Key / UUID index seek
  IF v_uid IS NOT NULL THEN
    SELECT role, lower(coalesce(status, '')) INTO v_role, v_status
    FROM public.employees
    WHERE id = v_uid
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      IF v_status = 'active' THEN
        RETURN v_role;
      ELSE
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  -- 2. JWT session email lookup
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT role, lower(coalesce(status, '')) INTO v_role, v_status
    FROM public.employees
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      IF v_status = 'active' THEN
        RETURN v_role;
      ELSE
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.get_my_role();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_site_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT e.site_id
  FROM public.employees e
  WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
    AND lower(coalesce(e.status, '')) = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_region_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT e.region_code
  FROM public.employees e
  WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
    AND lower(coalesce(e.status, '')) = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_email TEXT;
  v_site TEXT;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT e.site_id::text INTO v_site
    FROM public.employees e
    WHERE e.id = v_uid AND lower(coalesce(e.status, '')) = 'active';
    IF FOUND THEN RETURN v_site; END IF;
  END IF;

  v_email := (SELECT auth.jwt() ->> 'email');
  IF v_email IS NOT NULL THEN
    SELECT e.site_id::text INTO v_site
    FROM public.employees e
    WHERE lower(e.email) = lower(v_email) AND lower(coalesce(e.status, '')) = 'active'
    LIMIT 1;
    IF FOUND THEN RETURN v_site; END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- Finding 1: Photo/file access (Harden avatars bucket storage policies)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Avatar Manage v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Upload v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Manage" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Delete" ON storage.objects;

CREATE POLICY "Public Avatar Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Auth Active Avatar Upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
        AND lower(coalesce(e.status, '')) = 'active'
    )
    AND (
      name LIKE ('profile-photos/' || auth.uid()::text || '/%')
      OR name LIKE (auth.uid()::text || '/%')
      OR lower(coalesce(public.get_my_role(), '')) IN (
        'group_ceo', 'country_managing_director', 'country_hr_director',
        'regional_hr_manager', 'hr_generalist'
      )
    )
  );

CREATE POLICY "Auth Active Avatar Update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
        AND lower(coalesce(e.status, '')) = 'active'
    )
    AND (
      owner = auth.uid()
      OR name LIKE ('profile-photos/' || auth.uid()::text || '/%')
      OR name LIKE (auth.uid()::text || '/%')
      OR lower(coalesce(public.get_my_role(), '')) IN (
        'group_ceo', 'country_managing_director', 'country_hr_director',
        'regional_hr_manager', 'hr_generalist'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
        AND lower(coalesce(e.status, '')) = 'active'
    )
  );

CREATE POLICY "Auth Active Avatar Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
        AND lower(coalesce(e.status, '')) = 'active'
    )
    AND (
      owner = auth.uid()
      OR name LIKE ('profile-photos/' || auth.uid()::text || '/%')
      OR name LIKE (auth.uid()::text || '/%')
      OR lower(coalesce(public.get_my_role(), '')) IN (
        'group_ceo', 'country_managing_director', 'country_hr_director',
        'regional_hr_manager', 'hr_generalist'
      )
    )
  );

-- -----------------------------------------------------------------------------
-- Finding 3: Product deletion evidence guard
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.guard_product_delete_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE product_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot delete product with existing stock movements; preserve product for audit trail'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.sale_items WHERE product_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot delete product with existing sales history; preserve product for audit trail'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.po_items WHERE product_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot delete product referenced in purchase orders; preserve product for audit trail'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.inventory_requests WHERE product_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot delete product with existing inventory approval requests; preserve product for audit trail'
      USING ERRCODE = '42501';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_product_delete_evidence ON public.products;
CREATE TRIGGER guard_product_delete_evidence
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_product_delete_evidence();

-- -----------------------------------------------------------------------------
-- Finding 4: Warehouse assignment history (Port to production)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.retain_floor_stage_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  j public.wms_jobs%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME = 'wms_jobs' THEN
    IF OLD.type IN ('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
       AND nullif(OLD.order_ref, '') IS NOT NULL
       AND (nullif(OLD.assigned_to, '') IS NOT NULL
            OR nullif(OLD.completed_by, '') IS NOT NULL
            OR EXISTS (SELECT 1 FROM public.job_assignments WHERE job_id = OLD.id)) THEN
      RAISE EXCEPTION 'Retain warehouse stage history; cancel the job instead'
        USING ERRCODE = '42501';
    END IF;
  ELSE
    SELECT * INTO j FROM public.wms_jobs WHERE id = OLD.job_id;
    IF j.type IN ('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
       AND nullif(j.order_ref, '') IS NOT NULL THEN
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Warehouse assignment history cannot be deleted'
          USING ERRCODE = '42501';
      END IF;
      IF NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
        RAISE EXCEPTION 'Warehouse assignment attribution is immutable'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS retain_floor_assignment_history ON public.job_assignments;
CREATE TRIGGER retain_floor_assignment_history
  BEFORE DELETE OR UPDATE ON public.job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION private.retain_floor_stage_history();

DROP TRIGGER IF EXISTS retain_floor_stage_history ON public.wms_jobs;
CREATE TRIGGER retain_floor_stage_history
  BEFORE DELETE ON public.wms_jobs
  FOR EACH ROW
  EXECUTE FUNCTION private.retain_floor_stage_history();

-- -----------------------------------------------------------------------------
-- Finding 5: PO receiving evidence (Harden po_items delete policy and trigger)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS po_items_zero_trust_delete ON public.po_items;
CREATE POLICY po_items_zero_trust_delete ON public.po_items
  FOR DELETE TO authenticated
  USING (
    COALESCE(received_qty, 0) <= 0
    AND EXISTS (
      SELECT 1
      FROM purchase_orders po
      WHERE po.id = po_items.po_id
        AND po.status = ANY (ARRAY['Draft'::text, 'Pending'::text])
        AND lower(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text, 'country_managing_director'::text,
          'country_commercial_director'::text, 'regional_procurement_manager'::text,
          'country_supply_chain_director'::text, 'country_operations_director'::text,
          'regional_operations_manager'::text, 'buyer'::text,
          'demand_planner'::text, 'replenishment_planner'::text
        ])
        AND private.procurement_site_scope((po.site_id)::text, (po.country_code)::text)
    )
  );

CREATE OR REPLACE FUNCTION private.guard_po_item_delete_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(OLD.received_qty, 0) > 0 THEN
    RAISE EXCEPTION 'Cannot delete purchase order item with received quantity (SKU: %, received: %)',
      COALESCE(OLD.sku, OLD.product_name, 'unknown'), OLD.received_qty
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_po_item_delete_evidence ON public.po_items;
CREATE TRIGGER guard_po_item_delete_evidence
  BEFORE DELETE ON public.po_items
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_po_item_delete_evidence();

-- -----------------------------------------------------------------------------
-- Finding 6: Employee documents (Prohibit client hard deletion)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS employee_docs_delete ON public.employee_documents;
DROP POLICY IF EXISTS area_manager_delete_guard ON public.employee_documents;
REVOKE DELETE ON public.employee_documents FROM anon, authenticated;
