-- Align the PO update guard with the approved Operations approval authority.
BEGIN;
CREATE OR REPLACE FUNCTION private.guard_procurement_order_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    actor public.employees%ROWTYPE;
    actor_role text;
    actor_country text;
    actor_region text;
    order_region text;
    region_country text;
    region_status text;
    regional_limit numeric := 10000000;
    country_limit numeric := 100000000;
BEGIN
    IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
    SELECT * INTO actor FROM public.employees
      WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
    actor_role := public.normalize_role(actor.role::text);

    IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
        RAISE EXCEPTION 'Purchase order origin cannot be changed';
    END IF;
    IF OLD.status='Draft' AND NEW.status='Cancelled'
       AND (to_jsonb(NEW)-'status'-'updated_at')=(to_jsonb(OLD)-'status'-'updated_at')
       AND EXISTS(SELECT 1 FROM public.record_lifecycle_requests r WHERE r.id::text=current_setting('siifmart.lifecycle_request',true)
         AND r.kind='purchase_order' AND r.target_id=NEW.id AND r.status='Applied'
         AND r.requested_by=actor.id AND r.reviewed_by=actor.id AND r.applied_at=transaction_timestamp()
         AND r.decision_reason='Unsubmitted draft discarded by its preparer') THEN RETURN NEW; END IF;
    IF actor_role IN ('buyer', 'demand_planner', 'replenishment_planner')
       AND (OLD.status NOT IN ('Draft', 'Pending') OR NEW.status NOT IN ('Draft', 'Pending')) THEN
        RAISE EXCEPTION 'Buying and planning staff may prepare draft purchase orders only';
    END IF;
    IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
        NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
        IS DISTINCT FROM
       (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
        OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved', 'Rejected')) THEN
        -- Operations approval uses the same country, regional and financial bounds as the RPC.
        -- Keep the older rejection path restricted to its existing roles.
        IF actor_role IN ('regional_operations_manager', 'country_operations_director') THEN
            IF NEW.status <> 'Approved' OR OLD.status NOT IN ('Draft','Pending')
               OR NEW.approver_employee_id IS DISTINCT FROM actor.id::text
               OR NEW.approver_role IS DISTINCT FROM actor.role
               OR nullif(btrim(NEW.approval_reason_code),'') IS NULL THEN
                RAISE EXCEPTION 'Operations decisions require a verified PO approval';
            END IF;
            SELECT upper(s.country), coalesce(actor.region_code,s.region_code)
              INTO actor_country,actor_region FROM public.sites s WHERE s.id=actor.site_id;
            IF actor_country IS DISTINCT FROM upper(OLD.country_code) THEN
                RAISE EXCEPTION 'Approver is outside the PO country';
            END IF;
            order_region := coalesce(OLD.region_code,
                (SELECT s.region_code FROM public.sites s WHERE s.id=OLD.site_id));
            IF order_region IS NOT NULL THEN
                SELECT upper(r.country),lower(r.status),r.autonomous_po_limit
                  INTO region_country,region_status,regional_limit
                  FROM public.regions r WHERE r.code=order_region;
                IF NOT FOUND OR region_status <> 'active' OR regional_limit IS NULL OR regional_limit < 0
                   OR region_country IS DISTINCT FROM upper(OLD.country_code) THEN
                    RAISE EXCEPTION 'An active same-country regional PO limit is required';
                END IF;
            END IF;
            IF NEW.total_amount IS DISTINCT FROM OLD.total_amount OR OLD.total_amount IS NULL OR OLD.total_amount < 0
               OR (NEW.supplier_id,NEW.currency,NEW.payment_terms)
                  IS DISTINCT FROM (OLD.supplier_id,OLD.currency,OLD.payment_terms) THEN
                RAISE EXCEPTION 'Approval cannot change purchase order financial terms';
            END IF;
            IF actor_role='regional_operations_manager' AND
               (order_region IS NULL OR actor_region IS DISTINCT FROM order_region OR OLD.total_amount > regional_limit) THEN
                RAISE EXCEPTION 'Order exceeds your configured regional authority';
            END IF;
            SELECT coalesce(g.po_country_limit,100000000) INTO country_limit
              FROM public.country_governance_limits g WHERE upper(g.country_code)=upper(OLD.country_code);
            IF OLD.total_amount > coalesce(country_limit,100000000) THEN
                RAISE EXCEPTION 'Orders above the country limit require Group Executive sign-off';
            END IF;
            IF OLD.total_amount > regional_limit AND
               (OLD.finance_cleared_by_employee_id IS NULL OR OLD.finance_cleared_by_employee_id=actor.id
                OR OLD.finance_cleared_at IS NULL
                OR OLD.finance_cleared_amount IS DISTINCT FROM OLD.total_amount
                OR OLD.finance_cleared_supplier_id IS DISTINCT FROM OLD.supplier_id
                OR OLD.finance_cleared_currency IS DISTINCT FROM OLD.currency
                OR OLD.finance_cleared_payment_terms IS DISTINCT FROM OLD.payment_terms) THEN
                RAISE EXCEPTION 'Current independent finance clearance is required';
            END IF;
        END IF;
        IF actor_role NOT IN ('group_ceo', 'country_commercial_director', 'regional_procurement_manager',
                              'regional_operations_manager', 'country_operations_director') THEN
            RAISE EXCEPTION 'Purchase order decision requires a procurement lead';
        END IF;
        IF actor_role <> 'group_ceo' AND
           (lower(trim(COALESCE(OLD.created_by, ''))) IN (lower(trim(actor.name)), actor.id::text)
            OR lower(trim(COALESCE(OLD.requested_by, ''))) IN (lower(trim(actor.name)), actor.id::text)) THEN
            RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_procurement_order_decision() FROM PUBLIC, anon, authenticated;
COMMIT;
