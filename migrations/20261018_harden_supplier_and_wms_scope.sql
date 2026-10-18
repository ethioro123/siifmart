-- Restrict supplier financial data and WMS jobs to authorized country/site roles.

DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
CREATE POLICY suppliers_select_scoped ON public.suppliers FOR SELECT TO authenticated
USING (
  upper(COALESCE(suppliers.country_code,'')) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','auditor','procurement_manager','vendor_relations_manager','supply_chain_manager','buyer','finance_manager','operations_manager','regional_manager','store_manager','inventory_specialist'])
);
DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
CREATE POLICY suppliers_insert_scoped ON public.suppliers FOR INSERT TO authenticated
WITH CHECK (
  upper(COALESCE(suppliers.country_code,'')) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','vendor_relations_manager','supply_chain_manager','buyer','finance_manager','operations_manager','regional_manager'])
);
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;
CREATE POLICY suppliers_update_scoped ON public.suppliers FOR UPDATE TO authenticated
USING (
  upper(COALESCE(suppliers.country_code,'')) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','vendor_relations_manager','supply_chain_manager','buyer','finance_manager','operations_manager','regional_manager'])
)
WITH CHECK (
  upper(COALESCE(suppliers.country_code,'')) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','vendor_relations_manager','supply_chain_manager','buyer','finance_manager','operations_manager','regional_manager'])
);
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;
CREATE POLICY suppliers_delete_scoped ON public.suppliers FOR DELETE TO authenticated
USING (
  upper(COALESCE(suppliers.country_code,'')) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin'])
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_select ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_select ON public.wms_jobs FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
         OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
    AND (
      public.is_manager() OR public.is_admin()
      OR wms_jobs.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text, public.get_my_employee_code())
      OR EXISTS (
        SELECT 1 FROM public.job_assignments ja
        WHERE ja.job_id = wms_jobs.id
          AND ja.employee_id IN (auth.uid(), public.get_my_employee_id())
      )
    )
  )
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_insert ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_insert ON public.wms_jobs FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','logistics_manager',
    'warehouse_manager','store_manager','inventory_manager','receiver','picker','packer','forklift_operator',
    'stock_clerk','dispatcher','cashier','driver'])
  AND upper(wms_jobs.country_code) = upper(public.get_my_country_code())
  AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
       OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_update ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_update ON public.wms_jobs FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
         OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
    AND (public.is_manager() OR public.is_admin()
         OR wms_jobs.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text, public.get_my_employee_code())
         OR EXISTS (SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id = wms_jobs.id
                      AND ja.employee_id IN (auth.uid(), public.get_my_employee_id())))
  )
)
WITH CHECK (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
         OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
    AND (public.is_manager() OR public.is_admin()
         OR wms_jobs.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text, public.get_my_employee_code())
         OR EXISTS (SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id = wms_jobs.id
                      AND ja.employee_id IN (auth.uid(), public.get_my_employee_id())))
  )
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_delete ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_delete ON public.wms_jobs FOR DELETE TO authenticated
USING (public.is_ceo());
