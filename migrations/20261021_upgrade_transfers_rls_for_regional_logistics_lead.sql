-- Migration: Upgrade transfers RLS and trigger enforcement for Regional Logistics Leads
-- Applied to supabase-staging per Rule 9

-- 1. Upgrade transfers select policy
DROP POLICY IF EXISTS transfers_select_sovereign ON public.transfers;
CREATE POLICY transfers_select_sovereign ON public.transfers
FOR SELECT TO authenticated
USING (
  (public.get_my_role() = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text]))
  OR (
    country_code = public.get_my_country_code()
    AND (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'operations_manager', 'logistics_manager', 'finance_manager',
        'procurement_manager', 'auditor', 'regional_manager',
        'regional_logistics_lead', 'dispatch_manager', 'warehouse_manager',
        'inventory_manager', 'store_manager', 'admin'
      ])
      OR source_site_id = public.get_my_site_id()
      OR dest_site_id = public.get_my_site_id()
      OR (source_region_code = public.get_my_region_code() OR dest_region_code = public.get_my_region_code())
      OR (driver_id IS NOT NULL AND driver_id::text = auth.uid()::text)
    )
  )
);

-- 2. Upgrade transfers insert policy
DROP POLICY IF EXISTS transfers_insert_sovereign ON public.transfers;
CREATE POLICY transfers_insert_sovereign ON public.transfers
FOR INSERT TO authenticated
WITH CHECK (
  (public.get_my_role() = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text]))
  OR (
    country_code = public.get_my_country_code()
    AND (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'operations_manager', 'logistics_manager', 'regional_manager',
        'regional_logistics_lead', 'warehouse_manager', 'dispatch_manager',
        'inventory_manager', 'store_manager', 'admin'
      ])
      OR source_site_id = public.get_my_site_id()
    )
  )
);

-- 3. Upgrade transfers update policy
DROP POLICY IF EXISTS transfers_update_sovereign ON public.transfers;
CREATE POLICY transfers_update_sovereign ON public.transfers
FOR UPDATE TO authenticated
USING (
  (public.get_my_role() = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text]))
  OR (
    country_code = public.get_my_country_code()
    AND (
      public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'operations_manager', 'logistics_manager', 'regional_manager',
        'regional_logistics_lead', 'warehouse_manager', 'dispatch_manager',
        'inventory_manager', 'store_manager', 'admin'
      ])
      OR source_site_id = public.get_my_site_id()
      OR dest_site_id = public.get_my_site_id()
      OR (driver_id IS NOT NULL AND driver_id::text = auth.uid()::text)
    )
  )
);
