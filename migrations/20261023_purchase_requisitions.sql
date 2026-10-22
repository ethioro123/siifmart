BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.purchase_requisition_number_seq;

CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number text NOT NULL UNIQUE DEFAULT (
        'PR-' || lpad(nextval('public.purchase_requisition_number_seq'::regclass)::text, 8, '0')
    ),
    requester_employee_id uuid NOT NULL REFERENCES public.employees(id),
    requester_name text NOT NULL,
    requester_site_id uuid NOT NULL REFERENCES public.sites(id),
    destination_site_id uuid NOT NULL REFERENCES public.sites(id),
    country_code text NOT NULL CHECK (upper(country_code) IN ('ET', 'KE')),
    region_code text,
    title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 160),
    business_reason text NOT NULL CHECK (length(btrim(business_reason)) BETWEEN 3 AND 1200),
    items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0),
    estimated_total numeric NOT NULL DEFAULT 0 CHECK (estimated_total >= 0),
    currency text NOT NULL,
    status text NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Rejected', 'Converted')),
    reviewed_by_employee_id uuid REFERENCES public.employees(id),
    reviewed_at timestamptz,
    decision_reason text,
    purchase_order_id uuid UNIQUE REFERENCES public.purchase_orders(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

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
               OR coalesce(item->>'unit_cost', '') !~ '^[0-9]+(\.[0-9]{1,2})?$'
       ) THEN
        RAISE EXCEPTION 'Purchase request items are invalid' USING ERRCODE = '22023';
    END IF;
    NEW.requester_employee_id := v_actor.id;
    NEW.requester_name := v_actor.name;
    NEW.country_code := upper(v_destination.country);
    NEW.region_code := v_destination.region_code;
    NEW.currency := CASE upper(v_destination.country) WHEN 'KE' THEN 'KES' ELSE 'ETB' END;
    NEW.estimated_total := (
      SELECT COALESCE(sum((item->>'quantity')::numeric * (item->>'unit_cost')::numeric), 0)
        FROM jsonb_array_elements(NEW.items) item
    );
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_purchase_requisition_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_purchase_requisition_insert ON public.purchase_requisitions;
CREATE TRIGGER guard_purchase_requisition_insert
    BEFORE INSERT ON public.purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION private.guard_purchase_requisition_insert();

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_scope_status
    ON public.purchase_requisitions(country_code, region_code, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requester
    ON public.purchase_requisitions(requester_employee_id, created_at DESC);

ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.purchase_requisitions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.purchase_requisitions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.purchase_requisition_number_seq TO authenticated;

DROP POLICY IF EXISTS purchase_requisitions_read_scoped ON public.purchase_requisitions;
CREATE POLICY purchase_requisitions_read_scoped ON public.purchase_requisitions
    FOR SELECT TO authenticated
    USING (
        requester_employee_id = (SELECT auth.uid())
        OR private.procurement_site_scope(destination_site_id::text, country_code)
    );

DROP POLICY IF EXISTS purchase_requisitions_submit_scoped ON public.purchase_requisitions;
CREATE POLICY purchase_requisitions_submit_scoped ON public.purchase_requisitions
    FOR INSERT TO authenticated
    WITH CHECK (
        requester_employee_id = (SELECT auth.uid())
        AND status = 'Submitted'
        AND reviewed_by_employee_id IS NULL
        AND reviewed_at IS NULL
        AND purchase_order_id IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.employees actor
            JOIN public.sites home ON home.id = actor.site_id
            JOIN public.sites destination ON destination.id = destination_site_id
            WHERE actor.id = (SELECT auth.uid())
              AND COALESCE(lower(actor.status), 'active') = 'active'
              AND actor.site_id = requester_site_id
              AND upper(home.country) = upper(country_code)
              AND upper(destination.country) = upper(country_code)
              AND destination.type IN ('Warehouse', 'Distribution Center')
              AND (actor.region_code IS NULL OR destination.region_code IS NULL
                   OR actor.region_code = destination.region_code)
        )
    );

CREATE OR REPLACE FUNCTION public.review_purchase_requisition(
    p_request_id uuid,
    p_decision text,
    p_reason text DEFAULT NULL
)
RETURNS public.purchase_requisitions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_actor public.employees%ROWTYPE;
    v_request public.purchase_requisitions%ROWTYPE;
BEGIN
    IF p_decision NOT IN ('Approved', 'Rejected') THEN
        RAISE EXCEPTION 'Decision must be Approved or Rejected' USING ERRCODE = '22023';
    END IF;
    IF p_decision = 'Rejected' AND length(btrim(coalesce(p_reason, ''))) < 3 THEN
        RAISE EXCEPTION 'A reason is required when rejecting a purchase request' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_actor FROM public.employees
      WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF v_actor.id IS NULL OR public.normalize_role(v_actor.role::text) NOT IN (
        'group_ceo', 'country_managing_director', 'country_commercial_director',
        'regional_procurement_manager', 'country_supply_chain_director',
        'country_operations_director', 'regional_operations_manager', 'buyer'
    ) THEN
        RAISE EXCEPTION 'Procurement review permission is required' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_request FROM public.purchase_requisitions
      WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL OR v_request.status <> 'Submitted' THEN
        RAISE EXCEPTION 'Purchase request is no longer awaiting review' USING ERRCODE = '40001';
    END IF;
    IF v_request.requester_employee_id = v_actor.id THEN
        RAISE EXCEPTION 'The requester cannot review their own purchase request' USING ERRCODE = '42501';
    END IF;
    IF NOT private.procurement_site_scope(v_request.destination_site_id::text, v_request.country_code) THEN
        RAISE EXCEPTION 'Purchase request is outside your authorized region or country' USING ERRCODE = '42501';
    END IF;

    UPDATE public.purchase_requisitions
       SET status = p_decision,
           reviewed_by_employee_id = v_actor.id,
           reviewed_at = now(),
           decision_reason = NULLIF(btrim(p_reason), ''),
           updated_at = now()
     WHERE id = p_request_id
     RETURNING * INTO v_request;
    RETURN v_request;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_purchase_requisition(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_purchase_requisition(uuid, text, text) TO authenticated;

ALTER TABLE public.purchase_orders
    ADD COLUMN IF NOT EXISTS purchase_requisition_id uuid UNIQUE
        REFERENCES public.purchase_requisitions(id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requisition
    ON public.purchase_orders(purchase_requisition_id)
    WHERE purchase_requisition_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.link_purchase_requisition_to_po()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_request public.purchase_requisitions%ROWTYPE;
    v_actor_id uuid := (SELECT auth.uid());
BEGIN
    IF NEW.purchase_requisition_id IS NULL THEN RETURN NEW; END IF;
    SELECT * INTO v_request FROM public.purchase_requisitions
      WHERE id = NEW.purchase_requisition_id FOR UPDATE;
    IF v_request.id IS NULL OR v_request.status <> 'Approved'
       OR v_request.purchase_order_id IS NOT NULL
       OR v_request.destination_site_id IS DISTINCT FROM NEW.site_id
       OR upper(v_request.country_code) IS DISTINCT FROM upper(NEW.country_code)
       OR NEW.status NOT IN ('Draft', 'Pending')
       OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
        RAISE EXCEPTION 'Purchase order does not match an approved purchase request' USING ERRCODE = '23514';
    END IF;
    IF v_actor_id IS NULL OR v_request.requester_employee_id = v_actor_id THEN
        RAISE EXCEPTION 'The requester cannot create the purchase order for their own request' USING ERRCODE = '42501';
    END IF;

    UPDATE public.purchase_requisitions
       SET status = 'Converted', updated_at = now()
     WHERE id = v_request.id;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.set_purchase_requisition_po_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.purchase_requisition_id IS NOT NULL THEN
        UPDATE public.purchase_requisitions
           SET purchase_order_id = NEW.id, updated_at = now()
         WHERE id = NEW.purchase_requisition_id;
    END IF;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.link_purchase_requisition_to_po() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.set_purchase_requisition_po_id() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS link_purchase_requisition_to_po ON public.purchase_orders;
CREATE TRIGGER link_purchase_requisition_to_po
    BEFORE INSERT ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION private.link_purchase_requisition_to_po();
DROP TRIGGER IF EXISTS set_purchase_requisition_po_id ON public.purchase_orders;
CREATE TRIGGER set_purchase_requisition_po_id
    AFTER INSERT ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION private.set_purchase_requisition_po_id();

COMMIT;
