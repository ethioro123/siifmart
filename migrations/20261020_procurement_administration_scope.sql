-- Procurement staff work from their assigned Administration office.
CREATE FUNCTION private.procurement_site_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1 FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN ('buyer','vendor_relations_manager','demand_planner','customs_import_specialist')
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND ((home.code = upper(home.country) || '-HQ'
              AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (home.region_code IS NOT NULL
              AND actor.region_code = home.region_code
              AND target.region_code = home.region_code))
    );
$function$;
REVOKE ALL ON FUNCTION private.procurement_site_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.procurement_site_scope(text, text) TO authenticated, service_role;

-- Every order has a destination site. No country-wide OR branch is allowed.
DROP POLICY IF EXISTS po_zero_trust_select ON public.purchase_orders;
CREATE POLICY po_zero_trust_select ON public.purchase_orders FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
     'supply_chain_manager','operations_manager','regional_manager','finance_manager',
     'regional_finance_officer','auditor','buyer','vendor_relations_manager',
     'demand_planner','customs_import_specialist','replenishment_planner',
     'warehouse_manager','receiver','inventory_specialist')
  AND private.procurement_site_scope(site_id::text, country_code::text)
);
DROP POLICY IF EXISTS po_zero_trust_insert ON public.purchase_orders;
CREATE POLICY po_zero_trust_insert ON public.purchase_orders FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
     'supply_chain_manager','operations_manager','regional_manager','buyer')
  AND private.procurement_site_scope(site_id::text, country_code::text)
  AND status IN ('Draft','Pending')
  AND approved_by IS NULL AND approved_at IS NULL
  AND rejected_by IS NULL AND rejected_at IS NULL
);
DROP POLICY IF EXISTS po_zero_trust_update ON public.purchase_orders;
CREATE POLICY po_zero_trust_update ON public.purchase_orders FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
     'supply_chain_manager','operations_manager','regional_manager','finance_manager',
     'regional_finance_officer','buyer','warehouse_manager','receiver','inventory_specialist')
  AND private.procurement_site_scope(site_id::text, country_code::text)
) WITH CHECK (
  lower(public.get_my_role()) IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
     'supply_chain_manager','operations_manager','regional_manager','finance_manager',
     'regional_finance_officer','buyer','warehouse_manager','receiver','inventory_specialist')
  AND private.procurement_site_scope(site_id::text, country_code::text)
);

-- Order lines can be prepared only while the parent order awaits approval.
DROP POLICY IF EXISTS po_items_zero_trust_insert ON public.po_items;
CREATE POLICY po_items_zero_trust_insert ON public.po_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
    AND po.status IN ('Draft','Pending')
    AND lower(public.get_my_role()) IN
      ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
       'supply_chain_manager','operations_manager','regional_manager','buyer')
    AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));
DROP POLICY IF EXISTS po_items_zero_trust_update ON public.po_items;
CREATE POLICY po_items_zero_trust_update ON public.po_items FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
    AND po.status IN ('Draft','Pending')
    AND lower(public.get_my_role()) IN
      ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
       'supply_chain_manager','operations_manager','regional_manager','buyer')
    AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
    AND po.status IN ('Draft','Pending')
    AND lower(public.get_my_role()) IN
      ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
       'supply_chain_manager','operations_manager','regional_manager','buyer')
    AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));
DROP POLICY IF EXISTS po_items_zero_trust_delete ON public.po_items;
CREATE POLICY po_items_zero_trust_delete ON public.po_items FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
    AND po.status IN ('Draft','Pending')
    AND lower(public.get_my_role()) IN
      ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead',
       'supply_chain_manager','operations_manager','regional_manager','buyer')
    AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));

-- RPC and direct updates both pass through the same role/identity guard.
CREATE FUNCTION private.guard_procurement_order_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE actor public.employees%ROWTYPE;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
      IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
    RAISE EXCEPTION 'Purchase order origin cannot be changed';
  END IF;
  IF lower(actor.role) = 'buyer' AND
      (OLD.status NOT IN ('Draft','Pending') OR NEW.status NOT IN ('Draft','Pending')) THEN
    RAISE EXCEPTION 'Buyers may prepare draft purchase orders only';
  END IF;
  IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
      NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
      IS DISTINCT FROM
      (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
       OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
      OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved','Rejected')) THEN
    IF lower(actor.role) NOT IN
       ('super_admin','ceo','procurement_manager','regional_procurement_lead') THEN
      RAISE EXCEPTION 'Purchase order decision requires a procurement lead';
    END IF;
    IF lower(actor.role) NOT IN ('super_admin','ceo') AND
       (lower(trim(COALESCE(OLD.created_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)
        OR lower(trim(COALESCE(OLD.requested_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)) THEN
      RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_procurement_order_decision() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_procurement_order_decision BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION private.guard_procurement_order_decision();
