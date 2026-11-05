CREATE FUNCTION private.employee_role_rank(p_role text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT coalesce((SELECT rank FROM (VALUES ('group_ceo',100),('group_coo',99),('group_cfo',99),('group_cco',99),('group_cmo',99),('group_csco',99),('group_chro',99),('group_cto',99),('group_cio',99),('group_clco',99),('group_cae',99),('country_managing_director',98),('country_operations_director',97),('country_finance_director',97),('country_commercial_director',97),('country_supply_chain_director',97),('country_hr_director',97),('country_technology_director',97),('country_compliance_manager',97),('regional_operations_manager',90),('area_operations_manager',88),('regional_supply_chain_manager',83),('regional_procurement_manager',81),('regional_finance_manager',81),('regional_merchandising_manager',81),('regional_hr_manager',81),('regional_logistics_manager',81),('regional_security_manager',81),('regional_it_manager',81),('regional_compliance_manager',81),('store_manager',80),('warehouse_manager',80),('warehouse_operations_manager',78),('transport_fleet_manager',78),('inventory_manager',80),('cs_manager',60),('assistant_store_manager',60),('vendor_relations_manager',60),('fleet_maintenance_supervisor',58),('inventory_control_supervisor',57),('shift_supervisor',56),('stock_control_supervisor',56),('receiving_supervisor',56),('pos_supervisor',56),('putaway_replenishment_supervisor',56),('picking_supervisor',56),('packing_supervisor',56),('dispatch_supervisor',56),('returns_waste_supervisor',56),('inbound_operations_supervisor',56),('outbound_operations_supervisor',56),('receiving_team_leader',50),('picking_team_leader',50),('packing_team_leader',50),('dispatch_team_leader',50),('store_operations_auditor',45),('auditor',40),('payroll_specialist',40),('treasury_officer',38),('tax_compliance_officer',38),('credit_control_officer',36),('cash_office_officer',36),('accountant',35),('data_analyst',35),('training_coordinator',35),('talent_recruiter',35),('hr_generalist',35),('merchandising_specialist',35),('customs_import_specialist',35),('it_support',35),('dispatcher',35),('buyer',30),('demand_planner',30),('replenishment_planner',30),('inbound_qc_inspector',30),('loss_prevention',30),('cashier',30),('store_associate',28),('sales_associate',28),('inventory_controller',26),('stock_counter',25),('merchandiser',25),('inventory_specialist',25),('customer_service',25),('stock_clerk',25),('receiving_operator',24),('putaway_operator',24),('replenishment_operator',24),('dispatch_operator',24),('returns_operator',24),('fleet_mechanic',24),('picker',22),('packer',22),('receiver',22),('returns_clerk',22),('driver',20),('forklift_operator',20),('warehouse_administrator',24)) r(role,rank) WHERE role=p_role),0); $$;
REVOKE ALL ON FUNCTION private.employee_role_rank(text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.employee_private_access(p_employee uuid,p_site uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND private.has_active_operational_employee() AND
 (p_employee=auth.uid() OR (public.normalize_role(public.get_my_role()) IN('group_ceo','group_chro','group_cfo','country_managing_director','country_hr_director','country_finance_director','regional_hr_manager','regional_finance_manager','hr_generalist','payroll_specialist','accountant','auditor','country_compliance_manager')
 AND private.hr_site_scope(p_site::text)));
$$;
REVOKE ALL ON FUNCTION private.employee_private_access(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.employee_directory_rows() RETURNS SETOF public.employees
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RETURN; END IF;
 FOR e IN SELECT * FROM public.employees WHERE id=auth.uid() OR (private.has_active_operational_employee() AND site_id IS NOT NULL AND private.hr_site_scope(site_id::text)) LOOP
  IF NOT private.employee_private_access(e.id,e.site_id) THEN
   e.salary:=NULL;e.phone:=NULL;e.address:=NULL;e.emergency_contact:=NULL;e.age:=NULL;e.date_of_birth:=NULL;e.national_id_number:=NULL;
   e.last_login_gps:=NULL;e.last_login_device:=NULL;e.login_history:=NULL;
  END IF;
  RETURN NEXT e;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION private.employee_directory_rows() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.employee_directory_rows() TO authenticated;
CREATE VIEW public.employee_directory WITH(security_invoker=true) AS SELECT * FROM private.employee_directory_rows();
GRANT SELECT ON public.employee_directory TO authenticated;
REVOKE SELECT ON public.employees FROM anon,authenticated;
GRANT SELECT(id,site_id,name,role,email,status,join_date,department,avatar,performance_score,specialization,badges,attendance_rate,created_at,updated_at,code,last_login_at,region_code,scope_level,home_site_id,is_loaned,loaned_at,quota_approved_by,onboarding_tier,quota_status,credentials_handed_over_at,credentials_handed_over_by,job_title,reports_to_employee_id,functional_manager_employee_id) ON public.employees TO authenticated;

CREATE FUNCTION private.guard_employee_authority() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; home public.sites%ROWTYPE; target public.sites%ROWTYPE; command public.employee_change_requests%ROWTYPE; sensitive boolean;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO home FROM public.sites WHERE id=actor.site_id;
 SELECT * INTO target FROM public.sites WHERE id=NEW.site_id;
 IF NEW.role<>'group_ceo' AND target.id IS NULL THEN RAISE EXCEPTION 'Employee workplace required'; END IF;
 IF actor.role<>'group_ceo' AND (NOT public.is_site_in_my_authorized_scope(NEW.site_id::text,target.country) OR home.country IS DISTINCT FROM target.country) THEN RAISE EXCEPTION 'Employee country and workplace authority required' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
  IF private.employee_role_rank(NEW.role)=0 OR (actor.role<>'group_ceo' AND (private.employee_role_rank(actor.role)<=private.employee_role_rank(NEW.role)
   OR NEW.role LIKE 'group_%' OR (NEW.role LIKE 'country_%' AND actor.role NOT IN('country_managing_director','country_hr_director')))) THEN
   RAISE EXCEPTION 'Higher authorized employee appointment authority required' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='INSERT' THEN
  IF actor.role<>'group_ceo' AND NEW.status<>'Pending Approval' THEN RAISE EXCEPTION 'New employees require independent onboarding approval'; END IF;
 ELSE
  IF (NEW.attendance_rate,NEW.performance_score) IS DISTINCT FROM (OLD.attendance_rate,OLD.performance_score) AND actor.id=OLD.id THEN
   RAISE EXCEPTION 'Employee metrics cannot be self-certified' USING ERRCODE='42501'; END IF;
  sensitive:=(NEW.role,NEW.salary,NEW.site_id,NEW.region_code,NEW.scope_level,NEW.department,NEW.name,NEW.date_of_birth,NEW.national_id_number)
   IS DISTINCT FROM (OLD.role,OLD.salary,OLD.site_id,OLD.region_code,OLD.scope_level,OLD.department,OLD.name,OLD.date_of_birth,OLD.national_id_number);
  IF sensitive AND actor.role<>'group_ceo' THEN
   SELECT * INTO command FROM public.employee_change_requests WHERE id::text=current_setting('siifmart.employee_change',true) AND employee_id=NEW.id AND status='approved';
   IF command.id IS NULL THEN RAISE EXCEPTION 'Use a reviewed employee change transaction' USING ERRCODE='42501'; END IF;
  END IF;
  IF OLD.status='Pending Approval' AND NEW.status='Active' AND actor.role<>'group_ceo' THEN
   IF actor.role NOT IN('country_hr_director','regional_hr_manager') OR actor.id=NEW.id OR
    EXISTS(SELECT 1 FROM public.system_logs WHERE action='EMPLOYEE_RECRUITED' AND entity_id=NEW.id::text AND employee_id=actor.id::text) THEN
    RAISE EXCEPTION 'Independent HR onboarding approval required' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_employee_authority() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_employee_authority BEFORE INSERT OR UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION private.guard_employee_authority();
CREATE FUNCTION private.record_employee_recruiter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND auth.role()<>'service_role' THEN
 INSERT INTO public.system_logs(action,module,employee_id,entity_type,entity_id,details)
 VALUES('EMPLOYEE_RECRUITED','HR',auth.uid()::text,'employee',NEW.id::text,'Pending independent onboarding'); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.record_employee_recruiter() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER record_employee_recruiter AFTER INSERT ON public.employees FOR EACH ROW EXECUTE FUNCTION private.record_employee_recruiter();

CREATE FUNCTION private.guard_schedule_employee() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; site public.sites%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=NEW.employee_id;
 SELECT * INTO site FROM public.sites WHERE id=NEW.site_id;
 IF e.id IS NULL OR lower(e.status)<>'active' OR site.id IS NULL OR e.site_id IS DISTINCT FROM site.id OR NEW.country_code IS DISTINCT FROM site.country THEN
 RAISE EXCEPTION 'Schedule requires an active employee assigned to this facility and country'; END IF;
 NEW.employee_name:=e.name;NEW.role:=e.role;NEW.region_code:=site.region_code;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_schedule_employee() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_schedule_employee BEFORE INSERT OR UPDATE ON public.staff_schedules FOR EACH ROW EXECUTE FUNCTION private.guard_schedule_employee();
