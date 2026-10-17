-- Staging schema snapshot, part 13 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.reject_purchase_order(p_po_id uuid, p_rejector_id text, p_rejector_name text, p_rejector_role text, p_reason_code text, p_notes text DEFAULT ''::text, p_gps_coords text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_po RECORD;
    v_caller RECORD;
    v_effective_id TEXT;
    v_effective_name TEXT;
    v_effective_role TEXT;
    v_new_notes TEXT;
BEGIN
    IF auth.role() = 'authenticated' OR auth.uid() IS NOT NULL THEN
        SELECT e.id, e.name, e.role, e.status
        INTO v_caller
        FROM public.employees e
        WHERE e.id = auth.uid()
           OR e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        LIMIT 1;

        IF v_caller.id IS NULL THEN
            RAISE EXCEPTION 'Identity Verification Failed: No employee profile matches the authenticated session.';
        END IF;

        IF v_caller.status IS NOT NULL AND LOWER(v_caller.status) != 'active' THEN
            RAISE EXCEPTION 'Identity Verification Failed: The authenticated employee account is inactive.';
        END IF;

        IF p_rejector_id IS NOT NULL AND TRIM(p_rejector_id) != '' AND p_rejector_id != v_caller.id::text THEN
            RAISE EXCEPTION 'Identity Spoofing Blocked: Claimed rejector ID does not match signed-in employee profile.';
        END IF;

        v_effective_id := v_caller.id::text;
        v_effective_name := COALESCE(v_caller.name, p_rejector_name);
        v_effective_role := COALESCE(v_caller.role, p_rejector_role);
    ELSE
        v_effective_id := p_rejector_id;
        v_effective_name := p_rejector_name;
        v_effective_role := p_rejector_role;
    END IF;

    SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_po_id;
    END IF;

    IF v_po.status IN ('Received', 'Partially Received') THEN
        RAISE EXCEPTION 'Cannot reject purchase order that has already been received';
    END IF;

    IF p_reason_code IS NULL OR TRIM(p_reason_code) = '' THEN
        RAISE EXCEPTION 'Managerial Accountability Violation: Structured reason code is mandatory for PO rejection';
    END IF;

    v_new_notes := COALESCE(v_po.notes, '') || E'\n[REJECTED_BY:' || v_effective_name || E' (' || v_effective_role || E'):' || NOW()::text || E' REASON:' || p_reason_code || E']';
    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[REJECTION_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    UPDATE public.purchase_orders
    SET status = 'Rejected',
        rejected_by = v_effective_name,
        rejected_at = NOW(),
        rejection_reason_code = p_reason_code,
        rejection_notes = p_notes,
        notes = v_new_notes,
        updated_at = NOW()
    WHERE id = p_po_id;

    INSERT INTO public.system_logs (
        user_name,
        action,
        module,
        details,
        site_id,
        country_code,
        entity_type,
        entity_id,
        performed_by
    ) VALUES (
        v_effective_name,
        'PURCHASE_ORDER_REJECTED',
        'Procurement',
        json_build_object(
            'po_id', p_po_id,
            'po_number', v_po.po_number,
            'total_amount', v_po.total_amount,
            'currency', v_po.currency,
            'rejector_role', v_effective_role,
            'reason_code', p_reason_code,
            'notes', p_notes,
            'gps', p_gps_coords
        )::text,
        v_po.site_id,
        v_po.country_code,
        'purchase_orders',
        p_po_id::text,
        v_effective_id
    );

    RETURN json_build_object(
        'success', true,
        'po_id', p_po_id,
        'status', 'Rejected',
        'rejected_by', v_effective_name,
        'rejected_at', NOW()
    );
END;
$function$;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_default_shift_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.shift_number IS NULL OR NEW.shift_number = '' THEN
        NEW.shift_number := 'SHF-' || LPAD(nextval('shift_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_inventory_requests_country_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
        SELECT UPPER(COALESCE(s.country, 'ET')) INTO NEW.country_code
        FROM public.sites s
        WHERE (s.id::text = NEW.site_id::text OR s.code::text = NEW.site_id::text)
        LIMIT 1;

        IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
            NEW.country_code := COALESCE(public.get_my_country_code(), 'ET');
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_wms_jobs_default_country_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
        SELECT UPPER(COALESCE(s.country, 'ET')) INTO NEW.country_code
        FROM public.sites s
        WHERE (s.id::text = NEW.site_id::text OR s.code::text = NEW.site_id::text)
        LIMIT 1;
        
        IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
            NEW.country_code := COALESCE(public.get_my_country_code(), 'ET');
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.touch_pricing_rules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.trg_ensure_admin_site_on_new_country()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF NEW.country IS NOT NULL AND NEW.type != 'Administration' THEN
        IF NOT EXISTS (
            SELECT 1 FROM sites 
            WHERE UPPER(country) = UPPER(NEW.country) 
              AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
        ) THEN
            PERFORM auto_provision_country_admin_site(NEW.country);
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_job_assignments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_staff_schedules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_store_operations_audits_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.validate_pos_cash_drop_custody()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_supervisor RECORD;
BEGIN
    IF NEW.cashier_id = NEW.supervisor_id THEN
        RAISE EXCEPTION 'Dual Control Violation: Cashier cannot supervise their own cash drop.';
    END IF;

    SELECT id, name, role, site_id, country, status
    INTO v_supervisor
    FROM public.employees
    WHERE id::text = NEW.supervisor_id
       OR code = NEW.supervisor_id
    LIMIT 1;

    IF v_supervisor.id IS NULL THEN
        RAISE EXCEPTION 'Custody Verification Failed: Supervisor profile not found in employee records.';
    END IF;

    IF v_supervisor.status IS NOT NULL AND LOWER(v_supervisor.status) != 'active' THEN
        RAISE EXCEPTION 'Custody Verification Failed: Supervisor employee account is inactive.';
    END IF;

    IF LOWER(v_supervisor.role) NOT IN (
        'super_admin', 'ceo', 'admin', 'store_manager', 'warehouse_manager', 
        'operations_manager', 'regional_manager', 'supervisor', 'shift_lead', 'assistant_manager'
    ) THEN
        RAISE EXCEPTION 'Custody Verification Failed: Role "%" is not authorized to supervise cash drops.', v_supervisor.role;
    END IF;

    IF LOWER(v_supervisor.role) NOT IN ('super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager') THEN
        IF v_supervisor.site_id IS NOT NULL AND NEW.site_id IS NOT NULL AND v_supervisor.site_id::text != NEW.site_id::text THEN
            RAISE EXCEPTION 'Cross-Site Custody Violation: Supervisor belongs to site "%", not drop site "%".', v_supervisor.site_id, NEW.site_id;
        END IF;
    END IF;

    NEW.supervisor_name := COALESCE(v_supervisor.name, NEW.supervisor_name);
    NEW.supervisor_role := v_supervisor.role;

    RETURN NEW;
END;
$function$;
CREATE VIEW public."active_job_assignments" WITH (security_invoker = true) AS
SELECT ja.id,
    ja.job_id,
    ja.employee_id,
    ja.employee_name,
    ja.status,
    ja.assigned_at,
    ja.started_at,
    wj.type AS job_type,
    wj.priority AS job_priority,
    wj.items_count AS job_items,
    wj.location AS job_location,
    wj.order_ref,
    s.name AS site_name
   FROM job_assignments ja
     JOIN wms_jobs wj ON ja.job_id = wj.id
     JOIN sites s ON wj.site_id = s.id
  WHERE ja.status::text = ANY (ARRAY['Assigned'::character varying, 'Accepted'::character varying, 'In-Progress'::character varying, 'Paused'::character varying]::text[]);
CREATE VIEW public."employee_performance_metrics" WITH (security_invoker = true) AS
SELECT employee_id,
    employee_name,
    count(*) AS total_jobs,
    count(*) FILTER (WHERE status::text = 'Completed'::text) AS completed_jobs,
    avg(actual_duration) AS avg_duration_minutes,
    avg(accuracy_rate) AS avg_accuracy_rate,
    sum(units_processed) AS total_units_processed,
    max(completed_at) AS last_completed_at
   FROM job_assignments
  WHERE status::text = 'Completed'::text
  GROUP BY employee_id, employee_name;
CREATE VIEW public."product_merge_candidates" WITH (security_invoker = true) AS
SELECT country_code,
    lower(TRIM(BOTH FROM name)) AS normalized_name,
    count(*) AS master_count,
    array_agg(sku ORDER BY sku) AS skus,
    array_agg(id ORDER BY sku) AS master_ids
   FROM product_master
  WHERE status <> 'MERGED'::text
  GROUP BY country_code, (lower(TRIM(BOTH FROM name)))
 HAVING count(*) > 1;
CREATE VIEW public."role_hierarchy" WITH (security_invoker = true) AS
SELECT role,
        CASE
            WHEN role::text = 'super_admin'::text THEN 1
            WHEN role::text = ANY (ARRAY['regional_manager'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying, 'procurement_manager'::character varying, 'supply_chain_manager'::character varying, 'admin'::character varying, 'hr'::character varying]::text[]) THEN 2
            WHEN role::text = ANY (ARRAY['store_manager'::character varying, 'warehouse_manager'::character varying, 'dispatch_manager'::character varying, 'assistant_manager'::character varying, 'shift_lead'::character varying, 'manager'::character varying, 'store_supervisor'::character varying]::text[]) THEN 3
            ELSE 4
        END AS hierarchy_level,
        CASE
            WHEN role::text = 'super_admin'::text THEN 'Executive'::text
            WHEN role::text = ANY (ARRAY['regional_manager'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying, 'procurement_manager'::character varying, 'supply_chain_manager'::character varying, 'admin'::character varying, 'hr'::character varying]::text[]) THEN 'Director'::text
            WHEN role::text = ANY (ARRAY['store_manager'::character varying, 'warehouse_manager'::character varying, 'dispatch_manager'::character varying, 'assistant_manager'::character varying, 'shift_lead'::character varying, 'manager'::character varying, 'store_supervisor'::character varying]::text[]) THEN 'Manager'::text
            ELSE 'Staff'::text
        END AS hierarchy_name,
    count(*) AS employee_count
   FROM employees
  GROUP BY role
  ORDER BY (
        CASE
            WHEN role::text = 'super_admin'::text THEN 1
            WHEN role::text = ANY (ARRAY['regional_manager'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying, 'procurement_manager'::character varying, 'supply_chain_manager'::character varying, 'admin'::character varying, 'hr'::character varying]::text[]) THEN 2
            WHEN role::text = ANY (ARRAY['store_manager'::character varying, 'warehouse_manager'::character varying, 'dispatch_manager'::character varying, 'assistant_manager'::character varying, 'shift_lead'::character varying, 'manager'::character varying, 'store_supervisor'::character varying]::text[]) THEN 3
            ELSE 4
        END), role;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_enforce_employee_update_privileges BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION enforce_employee_update_privileges();
CREATE TRIGGER trigger_log_salary AFTER UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION log_sensitive_change();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_requests_country_code BEFORE INSERT ON inventory_requests FOR EACH ROW EXECUTE FUNCTION set_inventory_requests_country_code();
CREATE TRIGGER trg_inventory_requests_margin_floor BEFORE UPDATE ON inventory_requests FOR EACH ROW EXECUTE FUNCTION enforce_price_change_margin_floor();
CREATE TRIGGER trg_inventory_requests_zero_trust BEFORE UPDATE ON inventory_requests FOR EACH ROW EXECUTE FUNCTION enforce_inventory_requests_zero_trust();
CREATE TRIGGER trigger_calculate_job_assignment_duration BEFORE UPDATE ON job_assignments FOR EACH ROW WHEN (new.completed_at IS NOT NULL AND old.completed_at IS NULL) EXECUTE FUNCTION calculate_job_assignment_duration();
CREATE TRIGGER trigger_update_job_assignments_updated_at BEFORE UPDATE ON job_assignments FOR EACH ROW EXECUTE FUNCTION update_job_assignments_updated_at();
CREATE TRIGGER trg_validate_pos_cash_drop_custody BEFORE INSERT OR UPDATE ON pos_cash_drops FOR EACH ROW EXECUTE FUNCTION validate_pos_cash_drop_custody();
CREATE TRIGGER trg_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION touch_pricing_rules_updated_at();
CREATE TRIGGER trg_enforce_product_update_restrictions BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION enforce_product_update_restrictions();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_po_destination_warehouse_only BEFORE INSERT OR UPDATE OF site_id ON purchase_orders FOR EACH ROW EXECUTE FUNCTION check_po_destination_is_warehouse_or_dc();
CREATE TRIGGER trigger_generate_po_number BEFORE INSERT ON purchase_orders FOR EACH ROW EXECUTE FUNCTION generate_po_number();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_set_default_shift_number BEFORE INSERT ON shifts FOR EACH ROW EXECUTE FUNCTION set_default_shift_number();
CREATE TRIGGER trg_protect_country_admin_site BEFORE DELETE ON sites FOR EACH ROW EXECUTE FUNCTION protect_country_admin_site();
CREATE TRIGGER trg_sites_auto_provision_admin AFTER INSERT ON sites FOR EACH ROW EXECUTE FUNCTION trg_ensure_admin_site_on_new_country();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_staff_schedules_updated_at();
CREATE TRIGGER trigger_store_operations_audits_timestamp BEFORE UPDATE ON store_operations_audits FOR EACH ROW EXECUTE FUNCTION update_store_operations_audits_timestamp();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wms_jobs_default_country_code BEFORE INSERT ON wms_jobs FOR EACH ROW EXECUTE FUNCTION set_wms_jobs_default_country_code();
CREATE TRIGGER trg_wms_jobs_tamper_protection BEFORE UPDATE ON wms_jobs FOR EACH ROW EXECUTE FUNCTION enforce_wms_job_update_restrictions();
CREATE TRIGGER update_wms_jobs_updated_at BEFORE UPDATE ON wms_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
COMMENT ON TABLE public."barcode_approvals" IS 'Audit trail for cashier-generated barcode mappings requiring manager approval.';
COMMENT ON TABLE public."disciplinary_records" IS 'Formal disciplinary warnings, investigations, and grievances.';
COMMENT ON TABLE public."employee_tasks" IS 'Stores employee task assignments and progress tracking';
COMMENT ON TABLE public."hr_country_policies" IS 'Country-specific HR statutory policies and attendance thresholds.';
COMMENT ON TABLE public."job_assignments" IS 'Tracks assignment of WMS jobs to employees with performance metrics';
COMMENT ON TABLE public."job_candidates" IS 'Applicant tracking and interview scorecards.';
COMMENT ON TABLE public."job_requisitions" IS 'Staff headcount requisitions requiring HQ executive approval.';
COMMENT ON TABLE public."logistics_zones" IS 'Independently managed geographic logistics zones for grouping sites.';
COMMENT ON TABLE public."performance_reviews" IS 'Quarterly performance reviews with 4 operational pillars.';
COMMENT ON TABLE public."pos_cash_drops" IS 'Dual-control mid-day safe skims when cash registers exceed safety thresholds.';
COMMENT ON TABLE public."pos_supervisory_overrides" IS 'Audit trail of supervisory overrides (voids, kicks, refunds) with < 3% velocity tracking.';
COMMENT ON TABLE public."store_operations_audits" IS 'Unannounced store walkthroughs, planogram scoring, and cash spot audits under Central Operations Directorate (SOP-MGT-021).';
COMMENT ON TABLE public."training_records" IS 'Mandatory training certifications managed by training coordinators.';
COMMENT ON COLUMN public."employees"."role" IS 'SIIFMART enterprise role with strict Zero-Trust RBAC boundaries. Merchandising Manager is a Level 2 Corporate Administration role.';
COMMENT ON COLUMN public."employees"."code" IS 'Sovereign country-prefixed worker ID (e.g. KE-SIIF0044, ET-SIIF0020, UG-SIIF0100)';
COMMENT ON COLUMN public."job_assignments"."estimated_duration" IS 'Estimated time to complete job in minutes';
COMMENT ON COLUMN public."job_assignments"."actual_duration" IS 'Actual time taken to complete job in minutes (auto-calculated)';
COMMENT ON COLUMN public."job_assignments"."accuracy_rate" IS 'Percentage accuracy of job completion (0-100)';
COMMENT ON COLUMN public."logistics_zones"."name" IS 'Unique name of the logistics zone (e.g. Addis Ababa Zone, Dire Dawa Zone, Harar Zone).';
COMMENT ON COLUMN public."logistics_zones"."country" IS 'Operating market country code: ET (Ethiopia) or KE (Kenya)';
COMMENT ON COLUMN public."po_items"."identity_type" IS 'Product identity declaration: known (existing, barcode may differ), variant (existing, details may vary), new (create at receiving)';
COMMENT ON COLUMN public."products"."barcode" IS 'External barcode from supplier/manufacturer (EAN-13, UPC, etc.)';
COMMENT ON COLUMN public."products"."barcode_type" IS 'Type of barcode standard (EAN-13, UPC-A, CODE128, CODE39, QR, OTHER)';
COMMENT ON COLUMN public."products"."barcodes" IS 'Array of alternative barcodes (aliases) for this product';
COMMENT ON COLUMN public."products"."old_price" IS 'Stores the previous price before the last update for price history tracking';
COMMENT ON COLUMN public."purchase_orders"."po_number" IS 'Human-readable PO number (e.g., PO-0001, PO-0002)';
COMMENT ON COLUMN public."purchase_orders"."requested_by" IS 'The person who requested the purchase order';
COMMENT ON COLUMN public."purchase_orders"."created_by" IS 'The person who created the purchase order record';
COMMENT ON COLUMN public."sites"."code" IS 'Critical site identifier (e.g., SITE-0001). DO NOT CHANGE.';
COMMENT ON COLUMN public."sites"."warehouse_bonus_enabled" IS 'Whether warehouse workers at this site can earn bonuses';
COMMENT ON COLUMN public."sites"."bonus_enabled" IS 'Whether POS staff at this site can earn bonuses';
COMMENT ON COLUMN public."sites"."site_number" IS 'Numeric identifier for receipt generation (e.g., 5, 9)';
COMMENT ON COLUMN public."sites"."region" IS 'User-defined logistics zone name (e.g. Harar Zone, Addis Ababa Zone) to group locations for replenishment restrictions.';
COMMENT ON COLUMN public."sites"."logistics_zone_id" IS 'Link to the Logistics Zone for replenishment restrictions.';
COMMENT ON COLUMN public."sites"."country" IS 'Operating sovereign nation code: ET (Ethiopia) or KE (Kenya)';
COMMENT ON COLUMN public."sites"."currency" IS 'Local operational currency: ETB or KSh';
COMMENT ON COLUMN public."system_config"."enforce_regional_zoning" IS 'If true, restricts replenishment transfer requests to sites in the same logistics zone (unless overridden by CEO).';
COMMENT ON COLUMN public."system_config"."country_configs" IS 'Per-country operational settings partitions (ET, KE, etc.)';
COMMENT ON COLUMN public."system_config"."role_policies" IS 'Corporate Zero-Trust role security policies (MFA, session timeout, fencing)';
COMMENT ON COLUMN public."system_config"."role_permissions" IS 'Role access control permissions and Zero-Trust authority overrides';
COMMENT ON COLUMN public."system_config"."require_putaway_quantity_entry" IS 'Zero-Trust WMS: If true, requires operator to explicitly count and input units placed in bay rather than auto-crediting expected quantity.';
SET check_function_bodies = on;
RESET search_path;
