-- Migration: 20261104_production_schema_sync_and_auth_repair.sql
-- Description: Synchronize missing production tables, columns, and views with staging,
--              repair system_logs RLS insertion for authenticated users,
--              and provide a secure lookup RPC for worker ID login.

-- 1. Shifts & Counter Control Columns and Tables
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS count_submitted_at timestamptz;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS ledger_version integer NOT NULL DEFAULT 0;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cashier_id uuid REFERENCES public.employees(id);
CREATE INDEX IF NOT EXISTS sales_shift_id_idx ON public.sales(shift_id);

CREATE TABLE IF NOT EXISTS public.pos_shift_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id),
  site_id uuid NOT NULL REFERENCES public.sites(id),
  country_code text NOT NULL,
  actor_id uuid NOT NULL REFERENCES public.employees(id),
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_shift_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pos_shift_events' AND policyname = 'shift_events_read'
  ) THEN
    CREATE POLICY shift_events_read ON public.pos_shift_events FOR SELECT TO authenticated
    USING (public.is_site_in_my_authorized_scope(site_id::text, country_code));
  END IF;
END $$;

REVOKE ALL ON public.pos_shift_events FROM PUBLIC, anon;
GRANT SELECT ON public.pos_shift_events TO authenticated;

-- 2. Purchase Orders Delegated Limits Columns
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS country_md_recommended_by_employee_id uuid REFERENCES public.employees(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS country_md_recommended_at timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS country_md_recommendation_notes text;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS group_finance_cleared_by_employee_id uuid REFERENCES public.employees(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS group_finance_cleared_at timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS group_finance_clearance_reason text;

-- 3. Blind Receiving Helper & Views
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.strip_transfer_quantities(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_elem jsonb;
  v_res jsonb := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_res := v_res || jsonb_build_array(v_elem - 'quantity' - 'expected_quantity' - 'dispatched_quantity' - 'qty' - 'cost_price' - 'unit_cost');
  END LOOP;
  RETURN v_res;
END;
$$;

CREATE OR REPLACE FUNCTION private.is_blind_store_destination(p_dest uuid, p_source uuid) 
RETURNS boolean
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = '' 
AS $$
  SELECT auth.uid() IS NOT NULL AND p_dest = public.get_my_site_id() AND p_source IS DISTINCT FROM p_dest
  AND EXISTS(SELECT 1 FROM public.sites WHERE id = p_dest AND type IN ('Store', 'Dark Store'))
  AND public.get_my_role() NOT IN ('group_ceo', 'country_operations_director', 'regional_operations_manager');
$$;

REVOKE ALL ON FUNCTION private.is_blind_store_destination(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_blind_store_destination(uuid, uuid) TO authenticated;

CREATE OR REPLACE VIEW public.blind_receiving_wms WITH (security_barrier=true) AS
SELECT (jsonb_populate_record(NULL::public.wms_jobs, to_jsonb(j) || jsonb_build_object('line_items', private.strip_transfer_quantities(j.line_items), 'items_count', 0, 'notes', NULL, 'discrepancy_details', NULL))).*
FROM public.wms_jobs j 
WHERE auth.uid() IS NOT NULL 
  AND private.is_blind_store_destination(j.dest_site_id, coalesce(j.source_site_id, j.site_id))
  AND j.country_code = public.get_my_country_code() 
  AND j.type IN ('TRANSFER', 'DISPATCH', 'DRIVER') 
  AND coalesce(j.transfer_status, '') NOT IN ('Delivered', 'Partially Delivered', 'Received')
  AND public.is_site_in_my_authorized_scope(j.dest_site_id::text, j.country_code);

REVOKE ALL ON public.blind_receiving_wms FROM PUBLIC, anon;
GRANT SELECT ON public.blind_receiving_wms TO authenticated;

CREATE OR REPLACE VIEW public.blind_receiving_transfers WITH (security_barrier=true) AS
SELECT (jsonb_populate_record(NULL::public.transfers, to_jsonb(t) || jsonb_build_object('items', private.strip_transfer_quantities(t.items), 'notes', NULL, 'discrepancy_details', NULL))).*
FROM public.transfers t 
WHERE auth.uid() IS NOT NULL 
  AND private.is_blind_store_destination(t.dest_site_id, t.source_site_id)
  AND t.country_code = public.get_my_country_code() 
  AND t.status NOT IN ('Delivered', 'Partially Delivered', 'Received', 'Completed')
  AND public.is_site_in_my_authorized_scope(t.dest_site_id::text, t.country_code);

REVOKE ALL ON public.blind_receiving_transfers FROM PUBLIC, anon;
GRANT SELECT ON public.blind_receiving_transfers TO authenticated;

-- 4. Harden & Fix system_logs Insertion RLS
DROP POLICY IF EXISTS logs_insert ON public.system_logs;
DROP POLICY IF EXISTS logs_insert_actor_scoped ON public.system_logs;

CREATE POLICY logs_insert_actor_scoped ON public.system_logs
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (site_id IS NULL OR public.is_site_in_my_authorized_scope(site_id, country_code))
);

-- 5. Secure Worker Login Email Lookup RPC
CREATE OR REPLACE FUNCTION public.resolve_worker_login_email(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
  v_clean text;
BEGIN
  v_clean := trim(coalesce(p_identifier, ''));
  IF v_clean = '' OR length(v_clean) > 120 THEN
    RETURN NULL;
  END IF;

  -- 1. Try match by exact employee code (case-insensitive)
  SELECT e.email INTO v_email
  FROM public.employees e
  WHERE lower(e.code) = lower(v_clean)
    AND lower(coalesce(e.status, 'active')) = 'active'
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. If identifier has @, attempt match by email or code prefix
  IF v_clean LIKE '%@%' THEN
    SELECT e.email INTO v_email
    FROM public.employees e
    WHERE (lower(e.email) = lower(v_clean) OR lower(e.code) = lower(split_part(v_clean, '@', 1)))
      AND lower(coalesce(e.status, 'active')) = 'active'
    LIMIT 1;

    IF v_email IS NOT NULL THEN
      RETURN v_email;
    END IF;
  ELSE
    -- 3. Match by name
    SELECT e.email INTO v_email
    FROM public.employees e
    WHERE lower(e.name) = lower(v_clean)
      AND lower(coalesce(e.status, 'active')) = 'active'
    LIMIT 1;
  END IF;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_worker_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_worker_login_email(text) TO anon, authenticated;
