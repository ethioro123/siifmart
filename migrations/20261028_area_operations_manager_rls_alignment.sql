-- ============================================================================
-- SIIFMART AREA OPERATIONS MANAGER RLS & GOVERNANCE ALIGNMENT
-- Migration: 20261028_area_operations_manager_rls_alignment.sql
-- Purpose:
--   1. Adds area_operations_manager (and regional_it_manager, regional_compliance_manager)
--      to public.is_manager() so managerial RLS checks recognize Area Operations Managers.
--   2. Adds area_operations_manager to employees_insert and employees_update within
--      get_my_region_code() so they can certify frontline candidates and loan staff
--      across branches in their region.
--   3. Adds area_operations_manager to transfers and wms_jobs policies within their
--      authorized regional scope.
--   4. Adds area_operations_manager to expenses_update_lead so they can authorize
--      store petty cash expenses within their region.
-- ============================================================================

BEGIN;

-- 1. Update public.is_manager() to include area_operations_manager, regional_it_manager, regional_compliance_manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'group_ceo', 'country_managing_director',
    'country_operations_director', 'country_finance_director',
    'country_hr_director', 'country_commercial_director', 'country_supply_chain_director',
    'regional_operations_manager', 'area_operations_manager',
    'regional_supply_chain_manager', 'regional_procurement_manager',
    'regional_finance_manager', 'regional_hr_manager',
    'regional_logistics_manager', 'regional_security_manager',
    'regional_merchandising_manager', 'regional_it_manager', 'regional_compliance_manager',
    'buyer', 'store_manager', 'warehouse_manager', 'dispatch_supervisor',
    'assistant_store_manager', 'shift_supervisor',
    'fleet_maintenance_supervisor', 'corporate_merchandising_manager',
    'inventory_manager', 'vendor_relations_manager', 'cs_manager'
  );
END;
$function$;

-- 2. Update employees_insert and employees_update to include area_operations_manager within get_my_region_code()
DROP POLICY IF EXISTS employees_insert ON public.employees;
CREATE POLICY employees_insert
  ON public.employees
  FOR INSERT
  WITH CHECK (
    (public.get_my_role() = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'hr_generalist'::text
    ]))
    OR (
      (public.get_my_role() = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text
      ]))
      AND (
        site_id IN (SELECT sites.id FROM public.sites WHERE sites.region_code = public.get_my_region_code())
        OR region_code = public.get_my_region_code()
      )
      AND (role)::text <> ALL (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'regional_operations_manager'::text,
        'country_operations_director'::text,
        'country_finance_director'::text,
        'country_hr_director'::text
      ])
    )
    OR (
      public.is_manager()
      AND (site_id = public.get_my_site_id() OR public.get_my_site_id() IS NULL)
      AND (role)::text <> ALL (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'country_operations_director'::text,
        'country_finance_director'::text,
        'country_hr_director'::text
      ])
    )
  );

DROP POLICY IF EXISTS employees_update ON public.employees;
CREATE POLICY employees_update
  ON public.employees
  FOR UPDATE
  USING (
    (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'country_hr_director'::text,
        'hr_generalist'::text,
        'country_finance_director'::text
      ])
      AND public.is_site_in_my_authorized_scope((site_id)::text)
    )
    OR (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'regional_finance_manager'::text
      ])
      AND (
        region_code = public.get_my_region_code()
        OR site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code())
      )
      AND public.normalize_role((role)::text) <> ALL (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'regional_operations_manager'::text,
        'country_operations_director'::text,
        'country_finance_director'::text,
        'country_hr_director'::text
      ])
    )
    OR id = auth.uid()
    OR lower((email)::text) = lower((auth.jwt() ->> 'email'::text))
  )
  WITH CHECK (
    (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'country_hr_director'::text,
        'hr_generalist'::text,
        'country_finance_director'::text
      ])
      AND public.is_site_in_my_authorized_scope((site_id)::text)
    )
    OR (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'regional_finance_manager'::text
      ])
      AND (
        region_code = public.get_my_region_code()
        OR site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code())
      )
      AND public.normalize_role((role)::text) <> ALL (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'regional_operations_manager'::text,
        'country_operations_director'::text,
        'country_finance_director'::text,
        'country_hr_director'::text
      ])
    )
    OR id = auth.uid()
    OR lower((email)::text) = lower((auth.jwt() ->> 'email'::text))
  );

-- 3. Update transfers policies to include area_operations_manager
DROP POLICY IF EXISTS transfers_insert_sovereign ON public.transfers;
CREATE POLICY transfers_insert_sovereign
  ON public.transfers
  FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'group_ceo'::text
    OR (
      country_code = public.get_my_country_code()
      AND (
        public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'country_operations_director'::text,
          'regional_supply_chain_manager'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text,
          'regional_logistics_manager'::text,
          'warehouse_manager'::text,
          'dispatch_supervisor'::text,
          'inventory_manager'::text,
          'store_manager'::text,
          'country_managing_director'::text
        ])
        OR source_site_id = public.get_my_site_id()
      )
    )
  );

DROP POLICY IF EXISTS transfers_select_sovereign ON public.transfers;
CREATE POLICY transfers_select_sovereign
  ON public.transfers
  FOR SELECT
  USING (
    public.get_my_role() = 'group_ceo'::text
    OR (
      country_code = public.get_my_country_code()
      AND (
        public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'country_operations_director'::text,
          'regional_supply_chain_manager'::text,
          'country_finance_director'::text,
          'country_commercial_director'::text,
          'auditor'::text,
          'country_compliance_manager'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text,
          'regional_logistics_manager'::text,
          'dispatch_supervisor'::text,
          'warehouse_manager'::text,
          'inventory_manager'::text,
          'store_manager'::text,
          'country_managing_director'::text
        ])
        OR source_site_id = public.get_my_site_id()
        OR dest_site_id = public.get_my_site_id()
        OR source_region_code = public.get_my_region_code()
        OR dest_region_code = public.get_my_region_code()
        OR (driver_id IS NOT NULL AND (driver_id)::text = (auth.uid())::text)
      )
    )
  );

DROP POLICY IF EXISTS transfers_update_sovereign ON public.transfers;
CREATE POLICY transfers_update_sovereign
  ON public.transfers
  FOR UPDATE
  USING (
    public.get_my_role() = 'group_ceo'::text
    OR (
      country_code = public.get_my_country_code()
      AND (
        public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'country_operations_director'::text,
          'regional_supply_chain_manager'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text,
          'regional_logistics_manager'::text,
          'warehouse_manager'::text,
          'dispatch_supervisor'::text,
          'inventory_manager'::text,
          'store_manager'::text,
          'country_managing_director'::text
        ])
        OR source_site_id = public.get_my_site_id()
        OR dest_site_id = public.get_my_site_id()
        OR (driver_id IS NOT NULL AND (driver_id)::text = (auth.uid())::text)
      )
    )
  );

-- 4. Update wms_jobs policies to include area_operations_manager
DROP POLICY IF EXISTS destination_transfer_receipt_read ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_read
  ON public.wms_jobs
  FOR SELECT
  USING (
    (type)::text = 'TRANSFER'::text
    AND lower(public.get_my_role()) = ANY (ARRAY[
      'receiver'::text,
      'store_manager'::text,
      'warehouse_manager'::text,
      'inventory_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'country_operations_director'::text,
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_supply_chain_manager'::text,
      'replenishment_planner'::text,
      'inventory_specialist'::text,
      'dispatch_supervisor'::text,
      'regional_logistics_manager'::text,
      'country_supply_chain_director'::text
    ])
    AND public.is_site_in_my_authorized_scope((dest_site_id)::text, (country_code)::text)
    AND upper((country_code)::text) = upper(public.get_my_country_code())
    AND transfer_status = ANY (ARRAY['Shipped'::text, 'In-Transit'::text, 'Delivered'::text, 'Partially Delivered'::text, 'Received'::text])
  );

DROP POLICY IF EXISTS destination_transfer_receipt_update ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_update
  ON public.wms_jobs
  FOR UPDATE
  USING (
    (type)::text = 'TRANSFER'::text
    AND lower(public.get_my_role()) = ANY (ARRAY[
      'receiver'::text,
      'store_manager'::text,
      'warehouse_manager'::text,
      'inventory_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'country_operations_director'::text,
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_supply_chain_manager'::text,
      'replenishment_planner'::text,
      'inventory_specialist'::text,
      'dispatch_supervisor'::text,
      'regional_logistics_manager'::text,
      'country_supply_chain_director'::text
    ])
    AND public.is_site_in_my_authorized_scope((dest_site_id)::text, (country_code)::text)
    AND upper((country_code)::text) = upper(public.get_my_country_code())
    AND transfer_status = ANY (ARRAY['Delivered'::text, 'Partially Delivered'::text])
  )
  WITH CHECK (
    (type)::text = 'TRANSFER'::text
    AND lower(public.get_my_role()) = ANY (ARRAY[
      'receiver'::text,
      'store_manager'::text,
      'warehouse_manager'::text,
      'inventory_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'country_operations_director'::text,
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_supply_chain_manager'::text,
      'replenishment_planner'::text,
      'inventory_specialist'::text,
      'dispatch_supervisor'::text,
      'regional_logistics_manager'::text,
      'country_supply_chain_director'::text
    ])
    AND public.is_site_in_my_authorized_scope((dest_site_id)::text, (country_code)::text)
    AND upper((country_code)::text) = upper(public.get_my_country_code())
    AND transfer_status = 'Received'::text
    AND (status)::text = 'Completed'::text
  );

DROP POLICY IF EXISTS wms_jobs_zero_trust_insert ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_insert
  ON public.wms_jobs
  FOR INSERT
  WITH CHECK (
    public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_operations_director'::text,
      'regional_supply_chain_manager'::text,
      'warehouse_manager'::text,
      'store_manager'::text,
      'inventory_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_logistics_manager'::text,
      'regional_procurement_manager'::text,
      'country_commercial_director'::text,
      'country_supply_chain_director'::text,
      'dispatcher'::text,
      'cashier'::text,
      'driver'::text,
      'receiver'::text,
      'picker'::text,
      'packer'::text,
      'forklift_operator'::text,
      'stock_clerk'::text,
      'inventory_specialist'::text,
      'returns_clerk'::text,
      'returns_operator'::text,
      'receiving_operator'::text,
      'putaway_operator'::text,
      'replenishment_operator'::text
    ])
    AND upper((country_code)::text) = upper(public.get_my_country_code())
    AND (
      public.is_site_in_my_authorized_scope((site_id)::text, (country_code)::text)
      OR (dest_site_id IS NOT NULL AND public.is_site_in_my_authorized_scope((dest_site_id)::text, (country_code)::text))
    )
    AND (
      public.normalize_role(public.get_my_role()) <> ALL (ARRAY[
        'receiver'::text,
        'picker'::text,
        'packer'::text,
        'forklift_operator'::text,
        'stock_clerk'::text,
        'inventory_specialist'::text,
        'returns_clerk'::text,
        'returns_operator'::text,
        'receiving_operator'::text,
        'putaway_operator'::text,
        'replenishment_operator'::text
      ])
      OR upper((type)::text) <> ALL (ARRAY['DRIVER'::text, 'DELIVERY'::text, 'DISPATCH'::text])
    )
  );

-- 5. Update expenses_update_lead on public.expenses to include area_operations_manager
DROP POLICY IF EXISTS expenses_update_lead ON public.expenses;
CREATE POLICY expenses_update_lead
  ON public.expenses
  FOR UPDATE
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_finance_director'::text,
      'cfo'::text,
      'regional_finance_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.finance_site_scope((site_id)::text, (country_code)::text)
  )
  WITH CHECK (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_finance_director'::text,
      'cfo'::text,
      'regional_finance_manager'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.finance_site_scope((site_id)::text, (country_code)::text)
  );

COMMIT;
