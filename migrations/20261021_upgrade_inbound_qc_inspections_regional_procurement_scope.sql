-- Migration: 20261021_upgrade_inbound_qc_inspections_regional_procurement_scope.sql
-- Enables Regional Procurement Leads, Regional Directors, and Warehouse Inspectors
-- to log dockside inbound QC inspections with automatic PO site resolution and normalized roles.

-- 1. Trigger to automatically backfill po_id and site_id from purchase_orders if omitted
CREATE OR REPLACE FUNCTION public.trg_inbound_qc_resolve_po_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_po RECORD;
BEGIN
  IF (NEW.po_id IS NULL OR NEW.site_id IS NULL) AND NEW.po_number IS NOT NULL THEN
    SELECT id, site_id, country_code INTO v_po
    FROM public.purchase_orders
    WHERE po_number = NEW.po_number
       OR id::text = NEW.po_number
    LIMIT 1;

    IF v_po.id IS NOT NULL THEN
      IF NEW.po_id IS NULL THEN NEW.po_id := v_po.id; END IF;
      IF NEW.site_id IS NULL THEN NEW.site_id := v_po.site_id; END IF;
      IF NEW.country_code IS NULL THEN NEW.country_code := v_po.country_code; END IF;
    END IF;
  END IF;

  IF NEW.site_id IS NULL THEN
    SELECT site_id INTO NEW.site_id
    FROM public.employees
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inbound_qc_resolve_po_context_before ON public.inbound_qc_inspections;
CREATE TRIGGER trg_inbound_qc_resolve_po_context_before
  BEFORE INSERT OR UPDATE ON public.inbound_qc_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_inbound_qc_resolve_po_context();

-- 2. Upgrade RLS policies
DROP POLICY IF EXISTS "qc_inspections_insert_scoped" ON public.inbound_qc_inspections;
DROP POLICY IF EXISTS "qc_inspections_select_scoped" ON public.inbound_qc_inspections;
DROP POLICY IF EXISTS "qc_inspections_update_scoped" ON public.inbound_qc_inspections;
DROP POLICY IF EXISTS "qc_inspections_update" ON public.inbound_qc_inspections;

CREATE POLICY "qc_inspections_insert_scoped" ON public.inbound_qc_inspections
FOR INSERT TO authenticated
WITH CHECK (
  (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
    'super_admin', 'ceo', 'admin', 'operations_manager', 'procurement_manager',
    'supply_chain_manager', 'logistics_manager', 'warehouse_manager', 'inventory_manager',
    'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead',
    'inbound_qc_inspector', 'receiver', 'stock_clerk'
  ]))
  AND (
    site_id IS NULL
    OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
  )
);

CREATE POLICY "qc_inspections_select_scoped" ON public.inbound_qc_inspections
FOR SELECT TO authenticated
USING (
  (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
    'super_admin', 'ceo', 'admin', 'operations_manager', 'procurement_manager',
    'supply_chain_manager', 'logistics_manager', 'warehouse_manager', 'inventory_manager',
    'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead',
    'inbound_qc_inspector', 'receiver', 'stock_clerk'
  ]))
  AND (
    site_id IS NULL
    OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
  )
);

CREATE POLICY "qc_inspections_update_scoped" ON public.inbound_qc_inspections
FOR UPDATE TO authenticated
USING (
  (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
    'super_admin', 'ceo', 'admin', 'operations_manager', 'procurement_manager',
    'supply_chain_manager', 'logistics_manager', 'warehouse_manager', 'inventory_manager',
    'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead',
    'inbound_qc_inspector'
  ]))
  AND (
    site_id IS NULL
    OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
  )
)
WITH CHECK (
  (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
    'super_admin', 'ceo', 'admin', 'operations_manager', 'procurement_manager',
    'supply_chain_manager', 'logistics_manager', 'warehouse_manager', 'inventory_manager',
    'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead',
    'inbound_qc_inspector'
  ]))
  AND (
    site_id IS NULL
    OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
  )
);
