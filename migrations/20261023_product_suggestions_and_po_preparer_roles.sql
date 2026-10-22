BEGIN;

-- Site employees report product demand signals without supplier or cost knowledge.
CREATE TABLE public.product_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_employee_id uuid NOT NULL REFERENCES public.employees(id),
    site_id uuid NOT NULL REFERENCES public.sites(id),
    country_code text NOT NULL CHECK (length(country_code) = 2),
    region_code text,
    product_name text NOT NULL CHECK (length(btrim(product_name)) BETWEEN 2 AND 160),
    category text CHECK (category IS NULL OR length(category) <= 100),
    brand_or_example text CHECK (brand_or_example IS NULL OR length(brand_or_example) <= 160),
    product_details text CHECK (product_details IS NULL OR length(product_details) <= 500),
    demand_signal text NOT NULL CHECK (length(btrim(demand_signal)) BETWEEN 3 AND 1000),
    customer_request_count integer CHECK (customer_request_count IS NULL OR customer_request_count >= 0),
    status text NOT NULL DEFAULT 'Submitted'
        CHECK (status IN ('Submitted', 'Under Review', 'Accepted for Sourcing', 'Declined', 'Duplicate')),
    review_note text CHECK (review_note IS NULL OR length(review_note) <= 1200),
    reviewed_by_employee_id uuid REFERENCES public.employees(id),
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((status = 'Submitted' AND reviewed_by_employee_id IS NULL AND reviewed_at IS NULL)
        OR (status <> 'Submitted' AND reviewed_by_employee_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE INDEX product_suggestions_country_status_created_idx
    ON public.product_suggestions(country_code, status, created_at DESC);
CREATE INDEX product_suggestions_site_created_idx
    ON public.product_suggestions(site_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.guard_product_suggestion_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_actor public.employees%ROWTYPE;
    v_site public.sites%ROWTYPE;
BEGIN
    SELECT * INTO v_actor FROM public.employees
     WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF v_actor.id IS NULL OR v_actor.site_id IS NULL THEN
        RAISE EXCEPTION 'An active employee assigned to an operational site is required' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_site FROM public.sites WHERE id = v_actor.site_id;
    IF v_site.id IS NULL OR v_site.type NOT IN ('Store', 'Warehouse', 'Distribution Center') THEN
        RAISE EXCEPTION 'Product suggestions must come from an operational site' USING ERRCODE = '42501';
    END IF;
    IF NEW.submitter_employee_id IS DISTINCT FROM v_actor.id OR NEW.site_id IS DISTINCT FROM v_site.id THEN
        RAISE EXCEPTION 'Product suggestion submitter and site must match the signed-in employee' USING ERRCODE = '42501';
    END IF;
    NEW.country_code := upper(v_site.country);
    NEW.region_code := v_site.region_code;
    NEW.status := 'Submitted';
    NEW.review_note := NULL;
    NEW.reviewed_by_employee_id := NULL;
    NEW.reviewed_at := NULL;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_product_suggestion_insert() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_product_suggestion_insert
    BEFORE INSERT ON public.product_suggestions
    FOR EACH ROW EXECUTE FUNCTION private.guard_product_suggestion_insert();


CREATE OR REPLACE FUNCTION private.product_suggestion_site_scope(p_site_id text, p_country_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    SELECT private.procurement_site_scope(p_site_id, p_country_code)
        OR EXISTS (
            SELECT 1
            FROM public.employees actor
            JOIN public.sites home ON home.id = actor.site_id
            JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
            WHERE actor.id = (SELECT auth.uid())
              AND COALESCE(lower(actor.status), 'active') = 'active'
              AND public.normalize_role(actor.role::text) = 'merchandising_specialist'
              AND home.type = 'Administration'
              AND upper(home.country) = upper(target.country)
              AND upper(p_country_code) = upper(target.country)
              AND (
                  (home.code = upper(home.country) || '-HQ'
                   AND home.region_code IS NULL AND actor.region_code IS NULL)
                  OR (home.region_code IS NOT NULL
                      AND actor.region_code = home.region_code
                      AND target.region_code = home.region_code)
              )
        );
$function$;
REVOKE ALL ON FUNCTION private.product_suggestion_site_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.product_suggestion_site_scope(text, text) TO authenticated;

ALTER TABLE public.product_suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_suggestions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.product_suggestions TO authenticated;

CREATE POLICY product_suggestions_read_scoped ON public.product_suggestions
    FOR SELECT TO authenticated
    USING (
        submitter_employee_id = (SELECT auth.uid())
        OR (
            public.normalize_role(public.get_my_role()) IN (
                'group_ceo', 'country_commercial_director', 'country_supply_chain_director',
                'regional_procurement_manager', 'regional_merchandising_manager',
                'buyer', 'demand_planner', 'vendor_relations_manager', 'merchandising_specialist'
            )
            AND private.product_suggestion_site_scope(site_id::text, country_code)
        )
    );

CREATE POLICY product_suggestions_submit_scoped ON public.product_suggestions
    FOR INSERT TO authenticated
    WITH CHECK (
        submitter_employee_id = (SELECT auth.uid())
        AND status = 'Submitted'
        AND reviewed_by_employee_id IS NULL
        AND reviewed_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.employees actor
            JOIN public.sites home ON home.id = actor.site_id
            WHERE actor.id = (SELECT auth.uid())
              AND COALESCE(lower(actor.status), 'active') = 'active'
              AND actor.site_id = product_suggestions.site_id
              AND upper(home.country) = upper(country_code)
              AND home.type IN ('Store', 'Warehouse', 'Distribution Center')
        )
    );

CREATE OR REPLACE FUNCTION public.review_product_suggestion(
    p_suggestion_id uuid,
    p_decision text,
    p_note text DEFAULT NULL
)
RETURNS public.product_suggestions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_actor public.employees%ROWTYPE;
    v_suggestion public.product_suggestions%ROWTYPE;
BEGIN
    IF p_decision NOT IN ('Under Review', 'Accepted for Sourcing', 'Declined', 'Duplicate') THEN
        RAISE EXCEPTION 'Unsupported product suggestion decision' USING ERRCODE = '22023';
    END IF;
    IF p_decision IN ('Declined', 'Duplicate') AND length(btrim(coalesce(p_note, ''))) < 3 THEN
        RAISE EXCEPTION 'A note is required when declining or marking a duplicate' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_actor FROM public.employees
      WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF v_actor.id IS NULL OR public.normalize_role(v_actor.role::text) NOT IN (
        'group_ceo', 'country_commercial_director', 'country_supply_chain_director',
        'regional_procurement_manager', 'regional_merchandising_manager',
        'buyer', 'demand_planner', 'vendor_relations_manager', 'merchandising_specialist'
    ) THEN
        RAISE EXCEPTION 'Product suggestion review permission is required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_suggestion FROM public.product_suggestions
      WHERE id = p_suggestion_id FOR UPDATE;
    IF v_suggestion.id IS NULL OR v_suggestion.status NOT IN ('Submitted', 'Under Review') THEN
        RAISE EXCEPTION 'Product suggestion is no longer awaiting review' USING ERRCODE = '40001';
    END IF;
    IF v_suggestion.submitter_employee_id = v_actor.id THEN
        RAISE EXCEPTION 'The submitter cannot review their own suggestion' USING ERRCODE = '42501';
    END IF;
    IF NOT private.product_suggestion_site_scope(v_suggestion.site_id::text, v_suggestion.country_code) THEN
        RAISE EXCEPTION 'Product suggestion is outside your authorized country or region' USING ERRCODE = '42501';
    END IF;

    UPDATE public.product_suggestions
       SET status = p_decision,
           review_note = NULLIF(btrim(p_note), ''),
           reviewed_by_employee_id = v_actor.id,
           reviewed_at = now(),
           updated_at = now()
     WHERE id = p_suggestion_id
     RETURNING * INTO v_suggestion;
    RETURN v_suggestion;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_product_suggestion(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_product_suggestion(uuid, text, text) TO authenticated;

-- Replenishment and demand planners may prepare draft orders within their authorized scope.
DROP POLICY IF EXISTS po_zero_trust_insert ON public.purchase_orders;
CREATE POLICY po_zero_trust_insert ON public.purchase_orders FOR INSERT TO authenticated
WITH CHECK (
    lower(public.get_my_role()) IN (
        'group_ceo', 'country_managing_director', 'country_commercial_director',
        'regional_procurement_manager', 'country_supply_chain_director',
        'country_operations_director', 'regional_operations_manager', 'buyer',
        'demand_planner', 'replenishment_planner'
    )
    AND private.procurement_site_scope(site_id::text, country_code::text)
    AND status IN ('Draft', 'Pending')
    AND approved_by IS NULL AND approved_at IS NULL
    AND rejected_by IS NULL AND rejected_at IS NULL
);

DROP POLICY IF EXISTS po_zero_trust_update ON public.purchase_orders;
CREATE POLICY po_zero_trust_update ON public.purchase_orders FOR UPDATE TO authenticated
USING (
    lower(public.get_my_role()) IN (
        'group_ceo', 'country_managing_director', 'country_commercial_director',
        'regional_procurement_manager', 'country_supply_chain_director',
        'country_operations_director', 'regional_operations_manager', 'buyer',
        'demand_planner', 'replenishment_planner', 'warehouse_manager', 'receiver',
        'inventory_specialist'
    )
    AND private.procurement_site_scope(site_id::text, country_code::text)
)
WITH CHECK (
    lower(public.get_my_role()) IN (
        'group_ceo', 'country_managing_director', 'country_commercial_director',
        'regional_procurement_manager', 'country_supply_chain_director',
        'country_operations_director', 'regional_operations_manager', 'buyer',
        'demand_planner', 'replenishment_planner', 'warehouse_manager', 'receiver',
        'inventory_specialist'
    )
    AND private.procurement_site_scope(site_id::text, country_code::text)
);

DROP POLICY IF EXISTS po_items_zero_trust_insert ON public.po_items;
CREATE POLICY po_items_zero_trust_insert ON public.po_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
      AND po.status IN ('Draft', 'Pending')
      AND lower(public.get_my_role()) IN (
          'group_ceo', 'country_managing_director', 'country_commercial_director',
          'regional_procurement_manager', 'country_supply_chain_director',
          'country_operations_director', 'regional_operations_manager', 'buyer',
          'demand_planner', 'replenishment_planner'
      )
      AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));

DROP POLICY IF EXISTS po_items_zero_trust_update ON public.po_items;
CREATE POLICY po_items_zero_trust_update ON public.po_items FOR UPDATE TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
      AND po.status IN ('Draft', 'Pending')
      AND lower(public.get_my_role()) IN (
          'group_ceo', 'country_managing_director', 'country_commercial_director',
          'regional_procurement_manager', 'country_supply_chain_director',
          'country_operations_director', 'regional_operations_manager', 'buyer',
          'demand_planner', 'replenishment_planner'
      )
      AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
      AND po.status IN ('Draft', 'Pending')
      AND lower(public.get_my_role()) IN (
          'group_ceo', 'country_managing_director', 'country_commercial_director',
          'regional_procurement_manager', 'country_supply_chain_director',
          'country_operations_director', 'regional_operations_manager', 'buyer',
          'demand_planner', 'replenishment_planner'
      )
      AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));

DROP POLICY IF EXISTS po_items_zero_trust_delete ON public.po_items;
CREATE POLICY po_items_zero_trust_delete ON public.po_items FOR DELETE TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = po_id
      AND po.status IN ('Draft', 'Pending')
      AND lower(public.get_my_role()) IN (
          'group_ceo', 'country_managing_director', 'country_commercial_director',
          'regional_procurement_manager', 'country_supply_chain_director',
          'country_operations_director', 'regional_operations_manager', 'buyer',
          'demand_planner', 'replenishment_planner'
      )
      AND private.procurement_site_scope(po.site_id::text, po.country_code::text)
));

CREATE OR REPLACE FUNCTION private.guard_procurement_order_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    actor public.employees%ROWTYPE;
    actor_role text;
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
        IF actor_role NOT IN ('group_ceo', 'country_commercial_director', 'regional_procurement_manager') THEN
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

-- Existing stock requisitions need quantity and operational reason only. Procurement fills in sourcing and cost.
CREATE OR REPLACE FUNCTION private.guard_purchase_requisition_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_actor public.employees%ROWTYPE;
    v_home public.sites%ROWTYPE;
    v_destination public.sites%ROWTYPE;
BEGIN
    SELECT * INTO v_actor FROM public.employees
     WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    SELECT * INTO v_home FROM public.sites WHERE id = v_actor.site_id;
    SELECT * INTO v_destination FROM public.sites WHERE id = NEW.destination_site_id;
    IF v_actor.id IS NULL OR v_actor.site_id IS DISTINCT FROM NEW.requester_site_id
       OR upper(v_home.country) IS DISTINCT FROM upper(v_destination.country)
       OR v_destination.type NOT IN ('Warehouse', 'Distribution Center')
       OR lower(coalesce(v_destination.status, 'active')) <> 'active'
       OR (v_actor.region_code IS NOT NULL AND v_destination.region_code IS NOT NULL
           AND v_actor.region_code IS DISTINCT FROM v_destination.region_code) THEN
        RAISE EXCEPTION 'Purchase request destination is outside your authorized country or region' USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0
       OR EXISTS (
           SELECT 1 FROM jsonb_array_elements(NEW.items) item
            WHERE length(btrim(coalesce(item->>'product_name', ''))) = 0
               OR coalesce(item->>'quantity', '') !~ '^[1-9][0-9]*$'
               OR (item ? 'unit_cost' AND coalesce(item->>'unit_cost', '') <> ''
                   AND coalesce(item->>'unit_cost', '') !~ '^[0-9]+(\.[0-9]{1,2})?$')
       ) THEN
        RAISE EXCEPTION 'Purchase request items are invalid' USING ERRCODE = '22023';
    END IF;
    NEW.requester_employee_id := v_actor.id;
    NEW.requester_name := v_actor.name;
    NEW.country_code := upper(v_destination.country);
    NEW.region_code := v_destination.region_code;
    NEW.currency := CASE upper(v_destination.country) WHEN 'KE' THEN 'KES' ELSE 'ETB' END;
    NEW.estimated_total := (
      SELECT COALESCE(sum((item->>'quantity')::numeric * COALESCE(NULLIF(item->>'unit_cost', '')::numeric, 0)), 0)
        FROM jsonb_array_elements(NEW.items) item
    );
    RETURN NEW;
END;
$function$;

COMMIT;
