-- Country and site scoping for supplier and replenishment data.

DROP POLICY IF EXISTS replenishment_sources_read ON public.site_replenishment_sources;
CREATE POLICY replenishment_sources_read_scoped ON public.site_replenishment_sources
FOR SELECT TO authenticated
USING (
  public.is_site_in_my_authorized_scope(site_id::text, NULL)
  AND public.is_site_in_my_authorized_scope(source_site_id::text, NULL)
);

DROP POLICY IF EXISTS contracts_select ON public.vendor_contracts;
CREATE POLICY contracts_select_scoped ON public.vendor_contracts
FOR SELECT TO authenticated
USING (
  upper(vendor_contracts.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','procurement_manager','vendor_relations_manager','finance_manager')
);
DROP POLICY IF EXISTS contracts_insert ON public.vendor_contracts;
CREATE POLICY contracts_insert_scoped ON public.vendor_contracts
FOR INSERT TO authenticated
WITH CHECK (
  upper(vendor_contracts.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','procurement_manager','vendor_relations_manager','finance_manager')
);
DROP POLICY IF EXISTS contracts_update ON public.vendor_contracts;
DROP POLICY IF EXISTS vendor_contracts_update ON public.vendor_contracts;
CREATE POLICY contracts_update_scoped ON public.vendor_contracts
FOR UPDATE TO authenticated
USING (
  upper(vendor_contracts.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','procurement_manager','vendor_relations_manager','finance_manager')
)
WITH CHECK (
  upper(vendor_contracts.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','procurement_manager','vendor_relations_manager','finance_manager')
);

DROP POLICY IF EXISTS customs_select ON public.customs_declarations;
CREATE POLICY customs_select_scoped ON public.customs_declarations
FOR SELECT TO authenticated
USING (
  upper(customs_declarations.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','customs_import_specialist','procurement_manager','supply_chain_manager')
);
DROP POLICY IF EXISTS customs_insert ON public.customs_declarations;
CREATE POLICY customs_insert_scoped ON public.customs_declarations
FOR INSERT TO authenticated
WITH CHECK (
  upper(customs_declarations.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','customs_import_specialist','procurement_manager','supply_chain_manager')
);
DROP POLICY IF EXISTS customs_declarations_update ON public.customs_declarations;
DROP POLICY IF EXISTS customs_update ON public.customs_declarations;
CREATE POLICY customs_update_scoped ON public.customs_declarations
FOR UPDATE TO authenticated
USING (
  upper(customs_declarations.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','customs_import_specialist','procurement_manager','supply_chain_manager')
)
WITH CHECK (
  upper(customs_declarations.country_code) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) IN
      ('super_admin','ceo','customs_import_specialist','procurement_manager','supply_chain_manager')
);
