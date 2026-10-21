-- Migration: 20261021_wms_jobs_insert_include_regional_and_procurement_roles.sql
-- Upgrades wms_jobs_zero_trust_insert RLS policy to normalize roles
-- and authorize regional directors, procurement leads, and supply chain managers
-- to generate inbound receiving and operational WMS jobs within their authorized territory.

DROP POLICY IF EXISTS "wms_jobs_zero_trust_insert" ON public.wms_jobs;

CREATE POLICY "wms_jobs_zero_trust_insert" ON public.wms_jobs
FOR INSERT TO authenticated
WITH CHECK (
  (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
    'super_admin', 'ceo', 'admin', 'operations_manager', 'logistics_manager',
    'warehouse_manager', 'store_manager', 'inventory_manager',
    'regional_manager', 'regional_logistics_lead', 'regional_procurement_lead',
    'procurement_manager', 'supply_chain_manager',
    'receiver', 'picker', 'packer', 'forklift_operator', 'stock_clerk',
    'dispatcher', 'cashier', 'driver', 'inventory_specialist'
  ]))
  AND (upper(country_code::text) = upper(public.get_my_country_code()))
  AND (
    public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
    OR (dest_site_id IS NOT NULL AND public.is_site_in_my_authorized_scope(dest_site_id::text, country_code::text))
  )
  AND (
    (public.normalize_role(public.get_my_role()) <> 'inventory_specialist')
    OR (
      lower(type::text) = 'transfer'
      AND lower(COALESCE(status, '')) = ANY (ARRAY['draft', 'pending'])
      AND lower(COALESCE(transfer_status, '')) = ANY (ARRAY['draft', 'requested'])
    )
  )
);
