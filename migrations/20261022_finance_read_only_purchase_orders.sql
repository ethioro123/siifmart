-- Finance reads procurement records and clears defined exceptions through its RPC.
-- Direct PO edits remain with procurement and operational receiving roles.
DROP POLICY IF EXISTS po_zero_trust_update ON public.purchase_orders;
CREATE POLICY po_zero_trust_update ON public.purchase_orders
FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN (
    'super_admin', 'ceo', 'admin', 'head_of_procurement',
    'regional_procurement_manager', 'head_of_supply_chain', 'head_of_operations',
    'regional_operations_manager', 'buyer', 'warehouse_manager', 'receiver',
    'inventory_specialist'
  )
  AND private.procurement_site_scope(site_id::text, country_code::text)
)
WITH CHECK (
  lower(public.get_my_role()) IN (
    'super_admin', 'ceo', 'admin', 'head_of_procurement',
    'regional_procurement_manager', 'head_of_supply_chain', 'head_of_operations',
    'regional_operations_manager', 'buyer', 'warehouse_manager', 'receiver',
    'inventory_specialist'
  )
  AND private.procurement_site_scope(site_id::text, country_code::text)
);
