BEGIN;

-- Ensure Country Governance Limits table exists with sovereign defaults
CREATE TABLE IF NOT EXISTS public.country_governance_limits (
    country_code VARCHAR(10) PRIMARY KEY,
    po_regional_default_limit NUMERIC(14, 2) NOT NULL DEFAULT 10000000.00,
    po_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 100000000.00,
    expense_regional_limit NUMERIC(14, 2) NOT NULL DEFAULT 2000000.00,
    expense_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000000.00,
    headcount_country_buffer INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.country_governance_limits (country_code, po_regional_default_limit, po_country_limit, expense_regional_limit, expense_country_limit, headcount_country_buffer)
VALUES
  ('KE', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10),
  ('ET', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10)
ON CONFLICT (country_code) DO NOTHING;

-- Calibrated Unified Approval Inbox RPC reflecting Delegated Governance Framework
CREATE OR REPLACE FUNCTION public.get_my_approval_inbox(p_country_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $function$
DECLARE
  actor record;
  q record;
  n bigint;
  entries jsonb:='[]';
  total bigint:=0;
  product_inbox jsonb;
  item record;
  unavailable integer:=0;
BEGIN
  SELECT e.id, e.name, e.email, e.role, coalesce(e.region_code, s.region_code) region_code, upper(s.country) country
  INTO actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id
  WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,'active'))='active';

  IF actor.id IS NULL OR p_country_code IS NULL OR (actor.role<>'group_ceo' AND actor.country IS DISTINCT FROM upper(p_country_code)) THEN
    RAISE EXCEPTION 'Active employee in the requested country required' USING ERRCODE='42501';
  END IF;

  -- 1. Catalog & Planograms (1 merchandising approver for metadata/images)
  IF actor.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager','country_commercial_director') THEN
    BEGIN
      product_inbox:=public.get_my_product_approval_inbox(upper(p_country_code), 1);
      FOR item IN SELECT * FROM (VALUES ('product', 'productCount'),('planogram','planogramCount')) x(key,field) LOOP
        n:=(product_inbox->>item.field)::bigint;
        entries:=entries||jsonb_build_array(jsonb_build_object('key',item.key,'count',n,'status','ready'));
        total:=total+n;
      END LOOP;
    EXCEPTION WHEN insufficient_privilege OR undefined_function THEN
      entries:=entries||jsonb_build_array(jsonb_build_object('key','product','count',null,'status','unavailable'));
      unavailable:=unavailable+1;
    END;
  END IF;

  -- 2. Calibrated Tiered Registry Queries
  FOR q IN SELECT * FROM (VALUES
('purchase_orders',ARRAY['group_ceo','group_cfo','country_managing_director','country_commercial_director','regional_procurement_manager']::text[],$query$SELECT count(*) FROM public.purchase_orders r WHERE upper(r.country_code)=$1 AND r.status IN ('Draft','Pending') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,''))))
 AND r.total_amount>=0 AND EXISTS(SELECT 1 FROM public.suppliers v WHERE v.id=r.supplier_id AND upper(v.country_code)=$1
 AND (lower(v.verification_status)='verified' OR (lower(v.type)='one-time' AND lower(v.status)='active' AND lower(v.verification_status)='pending'))
 AND (lower(v.type) IS DISTINCT FROM 'one-time' OR NOT EXISTS(SELECT 1 FROM public.purchase_orders used WHERE used.supplier_id=v.id AND used.approved_at IS NOT NULL AND used.id<>r.id)))
 AND lower(trim(coalesce(r.created_by,''))) NOT IN($2::text,lower(trim($3)))
 AND EXISTS(SELECT 1 FROM public.sites dest LEFT JOIN public.regions reg ON reg.code=coalesce(r.region_code,dest.region_code)
 WHERE dest.id=r.site_id AND upper(dest.country)=$1
 AND (coalesce(r.region_code,dest.region_code) IS NULL OR (lower(reg.status)='active' AND upper(reg.country)=$1 AND reg.autonomous_po_limit>=0))
 AND (
   ($5='regional_procurement_manager' AND reg.code=$4 AND r.total_amount<=coalesce(reg.autonomous_po_limit,(SELECT po_regional_default_limit FROM public.country_governance_limits WHERE country_code=$1),10000000.00))
   OR
   ($5 IN ('country_commercial_director','country_managing_director') AND r.total_amount<=coalesce((SELECT po_country_limit FROM public.country_governance_limits WHERE country_code=$1),100000000.00)
    AND (r.total_amount<=coalesce(reg.autonomous_po_limit,(SELECT po_regional_default_limit FROM public.country_governance_limits WHERE country_code=$1),10000000.00)
     OR (r.finance_cleared_by_employee_id IS NOT NULL AND r.finance_cleared_by_employee_id<>$2 AND r.finance_cleared_at IS NOT NULL
      AND r.finance_cleared_amount=r.total_amount AND r.finance_cleared_supplier_id IS NOT DISTINCT FROM r.supplier_id
      AND r.finance_cleared_currency IS NOT DISTINCT FROM r.currency AND r.finance_cleared_payment_terms IS NOT DISTINCT FROM r.payment_terms)))
   OR
   ($5 IN ('group_ceo','group_cfo') AND (r.total_amount>coalesce((SELECT po_country_limit FROM public.country_governance_limits WHERE country_code=$1),100000000.00) OR coalesce(r.requires_hq_approval,false)))
 ))$query$),

('po_finance',ARRAY['country_finance_director','group_cfo']::text[],$query$SELECT count(*) FROM public.purchase_orders r WHERE upper(r.country_code)=$1 AND r.status IN ('Draft','Pending') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND lower(trim(coalesce(r.created_by,''))) NOT IN($2::text,lower(trim($3)))
 AND EXISTS(SELECT 1 FROM public.sites s JOIN public.regions reg ON reg.code=coalesce(r.region_code,s.region_code)
 WHERE s.id=r.site_id AND upper(reg.country)=$1 AND lower(reg.status)='active' AND reg.autonomous_po_limit>=0
 AND r.total_amount>coalesce(reg.autonomous_po_limit,(SELECT po_regional_default_limit FROM public.country_governance_limits WHERE country_code=$1),10000000.00)
 AND ($5='group_cfo' OR r.total_amount<=coalesce((SELECT po_country_limit FROM public.country_governance_limits WHERE country_code=$1),100000000.00)))
 AND NOT(r.finance_cleared_at IS NOT NULL AND r.finance_cleared_by_employee_id IS NOT NULL AND r.finance_cleared_amount=r.total_amount
 AND r.finance_cleared_supplier_id IS NOT DISTINCT FROM r.supplier_id AND r.finance_cleared_currency IS NOT DISTINCT FROM r.currency
 AND r.finance_cleared_payment_terms IS NOT DISTINCT FROM r.payment_terms)$query$),

('purchase_requests',ARRAY['buyer','regional_procurement_manager','country_supply_chain_director']::text[],$query$SELECT count(*) FROM public.purchase_requisitions r WHERE upper(r.country_code)=$1 AND r.status='Submitted' AND r.requester_employee_id<>$2 AND private.procurement_site_scope(r.destination_site_id::text,$1)$query$),

('product_suggestions',ARRAY['group_ceo','country_commercial_director','country_supply_chain_director','regional_procurement_manager','regional_merchandising_manager','buyer','demand_planner','vendor_relations_manager','merchandising_specialist']::text[],$query$SELECT count(*) FROM public.product_suggestions r WHERE upper(r.country_code)=$1 AND r.status IN ('Submitted','Under Review') AND r.submitter_employee_id<>$2 AND private.product_suggestion_site_scope(r.site_id::text,$1)$query$),

('expenses',ARRAY['group_ceo','group_cfo','country_managing_director','country_finance_director','regional_finance_manager','regional_operations_manager']::text[],$query$SELECT count(*) FROM public.expenses r WHERE upper(r.country_code)=$1 AND r.status='Pending' AND r.created_by_id::text IS DISTINCT FROM $2::text AND lower(trim(coalesce(r.created_by_name,'')))<>lower(trim($3))
 AND private.finance_site_scope(r.site_id::text,$1)
 AND (
   ($5 IN ('regional_operations_manager','regional_finance_manager') AND r.amount<=coalesce((SELECT reg.autonomous_expense_limit FROM public.regions reg JOIN public.sites s ON s.id=r.site_id WHERE reg.code=coalesce(r.region_code,s.region_code) AND upper(reg.country)=$1),(SELECT expense_regional_limit FROM public.country_governance_limits WHERE country_code=$1),2000000.00) AND NOT coalesce(r.escalated_to_ceo,false))
   OR
   ($5 IN ('country_managing_director','country_finance_director') AND r.amount>coalesce((SELECT reg.autonomous_expense_limit FROM public.regions reg JOIN public.sites s ON s.id=r.site_id WHERE reg.code=coalesce(r.region_code,s.region_code) AND upper(reg.country)=$1),(SELECT expense_regional_limit FROM public.country_governance_limits WHERE country_code=$1),2000000.00) AND r.amount<=coalesce((SELECT expense_country_limit FROM public.country_governance_limits WHERE country_code=$1),20000000.00) AND NOT coalesce(r.escalated_to_ceo,false))
   OR
   ($5 IN ('group_ceo','group_cfo') AND (r.amount>coalesce((SELECT expense_country_limit FROM public.country_governance_limits WHERE country_code=$1),20000000.00) OR coalesce(r.escalated_to_ceo,false)))
 )$query$),

('margin',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.margin_approval_requests r WHERE upper(r.country_code)=$1 AND r.status='Pending' AND r.requested_by_id::text IS DISTINCT FROM $2::text AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),

('transfers',ARRAY['group_ceo','country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','country_supply_chain_director','regional_supply_chain_manager','inventory_manager','regional_logistics_manager']::text[],$query$SELECT count(*) FROM public.wms_jobs r WHERE upper(r.country_code)=$1 AND r.type='TRANSFER' AND r.status NOT IN ('Cancelled','Completed') AND coalesce(r.transfer_status,'Requested') IN ('Draft','Requested','Approved') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,''))))
 AND public.is_site_in_my_authorized_scope(coalesce(r.source_site_id,r.site_id)::text,$1)
 AND EXISTS(SELECT 1 FROM public.sites s JOIN public.sites d ON d.id=r.dest_site_id
 WHERE s.id=coalesce(r.source_site_id,r.site_id) AND s.type IN ('Warehouse','Distribution Center') AND upper(s.country)=$1 AND upper(d.country)=$1)
 AND jsonb_array_length(coalesce(r.line_items,'[]'))>0$query$),

('hiring_requests',ARRAY['group_ceo','country_managing_director','country_hr_director','regional_hr_manager']::text[],$query$SELECT count(*) FROM public.job_requisitions r WHERE upper(r.country_code)=$1 AND r.status='pending_hq_approval' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)$query$),

('candidate_hr',ARRAY['group_ceo','group_chro','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager']::text[],$query$SELECT count(*) FROM public.job_candidates r WHERE upper(r.country_code)=$1 AND r.stage='offered' AND r.hr_approved_at IS NULL AND private.hr_site_scope(r.site_id,$1)$query$),

('candidate_finance',ARRAY['group_ceo','group_cfo','country_managing_director','country_finance_director','regional_finance_manager']::text[],$query$SELECT count(*) FROM public.job_candidates r WHERE upper(r.country_code)=$1 AND r.stage='offered' AND r.finance_approved_at IS NULL AND lower(coalesce(r.hr_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),

('salary',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.salary_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.employee_id<>$2 AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),

('headcount',ARRAY['group_ceo','group_chro','country_managing_director','country_hr_director','country_finance_director','regional_hr_manager','regional_finance_manager','country_operations_director','regional_operations_manager']::text[],$query$SELECT count(*) FROM public.headcount_quota_requests r WHERE upper(r.country_code)=$1 AND r.status='PENDING' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)
 AND (
   ($5 IN ('country_hr_director','regional_hr_manager') AND r.hr_cleared_at IS NULL)
   OR
   ($5 IN ('country_finance_director','regional_finance_manager') AND r.hr_cleared_at IS NOT NULL AND r.finance_cleared_at IS NULL)
   OR
   ($5='country_managing_director' AND r.hr_cleared_at IS NOT NULL AND r.finance_cleared_at IS NOT NULL AND r.cmd_approved_at IS NULL
    AND coalesce(r.increase_amount,0)<=coalesce((SELECT headcount_country_buffer FROM public.country_governance_limits WHERE country_code=$1),10)
    AND NOT coalesce(r.escalated_to_group,false))
   OR
   ($5 IN ('group_ceo','group_chro') AND (coalesce(r.increase_amount,0)>coalesce((SELECT headcount_country_buffer FROM public.country_governance_limits WHERE country_code=$1),10) OR coalesce(r.escalated_to_group,false)))
   OR
   ($5 NOT IN ('country_hr_director','regional_hr_manager','country_finance_director','regional_finance_manager','country_managing_director','group_ceo','group_chro'))
 )$query$),

('payroll_attestation',ARRAY['regional_hr_manager']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status NOT IN ('draft','rejected','disbursed') AND r.regional_attested_at IS NULL AND r.regional_attested_by_id IS NULL AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),

('payroll_hr',ARRAY['group_ceo','country_managing_director','country_hr_director','hr_generalist']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status IN ('pending_verification','pending_hr','pending_finance') AND r.hr_approved_by IS NULL AND lower(trim(r.initiated_by)) NOT IN ($2::text,lower(trim($3))) AND lower(coalesce(r.finance_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),

('payroll_finance',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status IN ('pending_verification','pending_hr','pending_finance') AND r.finance_approved_by IS NULL AND lower(trim(r.initiated_by)) NOT IN ($2::text,lower(trim($3))) AND lower(coalesce(r.hr_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),

('inventory',ARRAY['group_ceo','country_managing_director','regional_operations_manager','regional_procurement_manager','country_operations_director','country_commercial_director']::text[],$query$SELECT count(*) FROM public.inventory_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.change_type<>'edit' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND r.requested_by_employee_id IS DISTINCT FROM $2 AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),

('campaigns',ARRAY['group_ceo','country_commercial_director','regional_merchandising_manager']::text[],$query$SELECT count(*) FROM public.merchandising_campaign_proposals r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.requested_by_employee_id<>$2 AND private.merchandising_site_scope(r.scope_site_id::text,$1)$query$),

('leave',ARRAY['group_ceo','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager','country_operations_director','regional_operations_manager','area_operations_manager','store_manager','warehouse_manager']::text[],$query$SELECT count(*) FROM public.leave_requests r WHERE upper(r.country_code)=$1 AND lower(r.status)='pending' AND r.employee_id<>$2 AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)$query$),

('employee_changes',ARRAY['group_ceo','hr_generalist','regional_hr_manager','regional_supply_chain_manager','country_managing_director','regional_procurement_manager','group_cfo','regional_operations_manager','country_supply_chain_director','warehouse_manager','country_commercial_director','country_finance_director','regional_security_manager','store_manager','country_technology_director','regional_finance_manager','compliance_officer','regional_logistics_manager','country_hr_director','country_compliance_manager','country_operations_director']::text[],$query$SELECT count(*) FROM public.employee_change_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.employee_id<>$2 AND private.hr_site_scope(r.site_id,$1) AND ($5='group_ceo' OR (lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND (($5=ANY(ARRAY['country_managing_director','country_hr_director','regional_hr_manager','hr_generalist']::text[]) AND r.required_approvers ? 'Human Resources') OR ($5=ANY(ARRAY['country_managing_director','country_finance_director','regional_finance_manager','group_cfo']::text[]) AND r.required_approvers ? 'Finance Department') OR ($5=ANY(ARRAY['country_managing_director','country_operations_director','regional_operations_manager','store_manager']::text[]) AND r.required_approvers ? 'Operations Management') OR ($5=ANY(ARRAY['country_managing_director','country_supply_chain_director','country_operations_director','regional_logistics_manager','regional_operations_manager','warehouse_manager','regional_supply_chain_manager']::text[]) AND r.required_approvers ? 'Logistics & Warehouse') OR ($5=ANY(ARRAY['country_managing_director','country_commercial_director','country_supply_chain_director','country_operations_director','regional_procurement_manager','regional_operations_manager']::text[]) AND r.required_approvers ? 'Procurement') OR ($5=ANY(ARRAY['country_managing_director','country_compliance_manager','country_technology_director','country_operations_director','regional_security_manager','regional_operations_manager']::text[]) AND r.required_approvers ? 'Security Management') OR ($5=ANY(ARRAY['group_ceo','country_managing_director','country_compliance_manager','compliance_officer']::text[]) AND r.required_approvers ? 'Executive / Compliance')) AND EXISTS(SELECT 1 FROM public.employees subject WHERE subject.id=r.employee_id AND (CASE $5 WHEN 'group_ceo' THEN 100 WHEN 'group_coo' THEN 99 WHEN 'group_cfo' THEN 99 WHEN 'group_cco' THEN 99 WHEN 'group_cmo' THEN 99 WHEN 'group_csco' THEN 99 WHEN 'group_chro' THEN 99 WHEN 'group_cto' THEN 99 WHEN 'group_cio' THEN 99 WHEN 'group_clco' THEN 99 WHEN 'group_cae' THEN 99 WHEN 'country_managing_director' THEN 98 WHEN 'country_operations_director' THEN 97 WHEN 'country_finance_director' THEN 97 WHEN 'country_commercial_director' THEN 97 WHEN 'country_supply_chain_director' THEN 97 WHEN 'country_hr_director' THEN 97 WHEN 'country_technology_director' THEN 97 WHEN 'country_compliance_manager' THEN 97 WHEN 'regional_operations_manager' THEN 90 WHEN 'area_operations_manager' THEN 88 WHEN 'regional_supply_chain_manager' THEN 83 WHEN 'regional_procurement_manager' THEN 81 WHEN 'regional_finance_manager' THEN 81 WHEN 'regional_merchandising_manager' THEN 81 WHEN 'regional_hr_manager' THEN 81 WHEN 'regional_logistics_manager' THEN 81 WHEN 'regional_security_manager' THEN 81 WHEN 'regional_it_manager' THEN 81 WHEN 'regional_compliance_manager' THEN 81 WHEN 'store_manager' THEN 80 WHEN 'warehouse_manager' THEN 80 WHEN 'warehouse_operations_manager' THEN 78 WHEN 'transport_fleet_manager' THEN 78 WHEN 'inventory_manager' THEN 80 WHEN 'cs_manager' THEN 60 WHEN 'assistant_store_manager' THEN 60 WHEN 'vendor_relations_manager' THEN 60 WHEN 'fleet_maintenance_supervisor' THEN 58 WHEN 'inventory_control_supervisor' THEN 57 WHEN 'shift_supervisor' THEN 56 WHEN 'stock_control_supervisor' THEN 56 WHEN 'receiving_supervisor' THEN 56 WHEN 'pos_supervisor' THEN 56 WHEN 'putaway_replenishment_supervisor' THEN 56 WHEN 'picking_supervisor' THEN 56 WHEN 'packing_supervisor' THEN 56 WHEN 'dispatch_supervisor' THEN 56 WHEN 'returns_waste_supervisor' THEN 56 WHEN 'inbound_operations_supervisor' THEN 56 WHEN 'outbound_operations_supervisor' THEN 56 WHEN 'receiving_team_leader' THEN 50 WHEN 'picking_team_leader' THEN 50 WHEN 'packing_team_leader' THEN 50 WHEN 'dispatch_team_leader' THEN 50 WHEN 'store_operations_auditor' THEN 45 WHEN 'auditor' THEN 40 WHEN 'payroll_specialist' THEN 40 WHEN 'treasury_officer' THEN 38 WHEN 'tax_compliance_officer' THEN 38 WHEN 'credit_control_officer' THEN 36 WHEN 'cash_office_officer' THEN 36 WHEN 'accountant' THEN 35 WHEN 'data_analyst' THEN 35 WHEN 'training_coordinator' THEN 35 WHEN 'talent_recruiter' THEN 35 WHEN 'hr_generalist' THEN 35 WHEN 'merchandising_specialist' THEN 35 WHEN 'customs_import_specialist' THEN 35 WHEN 'it_support' THEN 35 WHEN 'dispatcher' THEN 35 WHEN 'buyer' THEN 30 WHEN 'demand_planner' THEN 30 WHEN 'replenishment_planner' THEN 30 WHEN 'inbound_qc_inspector' THEN 30 WHEN 'loss_prevention' THEN 30 WHEN 'cashier' THEN 30 WHEN 'store_associate' THEN 28 WHEN 'sales_associate' THEN 28 WHEN 'inventory_controller' THEN 26 WHEN 'stock_counter' THEN 25 WHEN 'merchandiser' THEN 25 WHEN 'inventory_specialist' THEN 25 WHEN 'customer_service' THEN 25 WHEN 'stock_clerk' THEN 25 WHEN 'receiving_operator' THEN 24 WHEN 'putaway_operator' THEN 24 WHEN 'replenishment_operator' THEN 24 WHEN 'dispatch_operator' THEN 24 WHEN 'returns_operator' THEN 24 WHEN 'fleet_mechanic' THEN 24 WHEN 'picker' THEN 22 WHEN 'packer' THEN 22 WHEN 'receiver' THEN 22 WHEN 'returns_clerk' THEN 22 WHEN 'driver' THEN 20 WHEN 'forklift_operator' THEN 20 WHEN 'warehouse_administrator' THEN 24 ELSE 0 END)>(CASE subject.role WHEN 'group_ceo' THEN 100 WHEN 'group_coo' THEN 99 WHEN 'group_cfo' THEN 99 WHEN 'group_cco' THEN 99 WHEN 'group_cmo' THEN 99 WHEN 'group_csco' THEN 99 WHEN 'group_chro' THEN 99 WHEN 'group_cto' THEN 99 WHEN 'group_cio' THEN 99 WHEN 'group_clco' THEN 99 WHEN 'group_cae' THEN 99 WHEN 'country_managing_director' THEN 98 WHEN 'country_operations_director' THEN 97 WHEN 'country_finance_director' THEN 97 WHEN 'country_commercial_director' THEN 97 WHEN 'country_supply_chain_director' THEN 97 WHEN 'country_hr_director' THEN 97 WHEN 'country_technology_director' THEN 97 WHEN 'country_compliance_manager' THEN 97 WHEN 'regional_operations_manager' THEN 90 WHEN 'area_operations_manager' THEN 88 WHEN 'regional_supply_chain_manager' THEN 83 WHEN 'regional_procurement_manager' THEN 81 WHEN 'regional_finance_manager' THEN 81 WHEN 'regional_merchandising_manager' THEN 81 WHEN 'regional_hr_manager' THEN 81 WHEN 'regional_logistics_manager' THEN 81 WHEN 'regional_security_manager' THEN 81 WHEN 'regional_it_manager' THEN 81 WHEN 'regional_compliance_manager' THEN 81 WHEN 'store_manager' THEN 80 WHEN 'warehouse_manager' THEN 80 WHEN 'warehouse_operations_manager' THEN 78 WHEN 'transport_fleet_manager' THEN 78 WHEN 'inventory_manager' THEN 80 WHEN 'cs_manager' THEN 60 WHEN 'assistant_store_manager' THEN 60 WHEN 'vendor_relations_manager' THEN 60 WHEN 'fleet_maintenance_supervisor' THEN 58 WHEN 'inventory_control_supervisor' THEN 57 WHEN 'shift_supervisor' THEN 56 WHEN 'stock_control_supervisor' THEN 56 WHEN 'receiving_supervisor' THEN 56 WHEN 'pos_supervisor' THEN 56 WHEN 'putaway_replenishment_supervisor' THEN 56 WHEN 'picking_supervisor' THEN 56 WHEN 'packing_supervisor' THEN 56 WHEN 'dispatch_supervisor' THEN 56 WHEN 'returns_waste_supervisor' THEN 56 WHEN 'inbound_operations_supervisor' THEN 56 WHEN 'outbound_operations_supervisor' THEN 56 WHEN 'receiving_team_leader' THEN 50 WHEN 'picking_team_leader' THEN 50 WHEN 'packing_team_leader' THEN 50 WHEN 'dispatch_team_leader' THEN 50 WHEN 'store_operations_auditor' THEN 45 WHEN 'auditor' THEN 40 WHEN 'payroll_specialist' THEN 40 WHEN 'treasury_officer' THEN 38 WHEN 'tax_compliance_officer' THEN 38 WHEN 'credit_control_officer' THEN 36 WHEN 'cash_office_officer' THEN 36 WHEN 'accountant' THEN 35 WHEN 'data_analyst' THEN 35 WHEN 'training_coordinator' THEN 35 WHEN 'talent_recruiter' THEN 35 WHEN 'hr_generalist' THEN 35 WHEN 'merchandising_specialist' THEN 35 WHEN 'customs_import_specialist' THEN 35 WHEN 'it_support' THEN 35 WHEN 'dispatcher' THEN 35 WHEN 'buyer' THEN 30 WHEN 'demand_planner' THEN 30 WHEN 'replenishment_planner' THEN 30 WHEN 'inbound_qc_inspector' THEN 30 WHEN 'loss_prevention' THEN 30 WHEN 'cashier' THEN 30 WHEN 'store_associate' THEN 28 WHEN 'sales_associate' THEN 28 WHEN 'inventory_controller' THEN 26 WHEN 'stock_counter' THEN 25 WHEN 'merchandiser' THEN 25 WHEN 'inventory_specialist' THEN 25 WHEN 'customer_service' THEN 25 WHEN 'stock_clerk' THEN 25 WHEN 'receiving_operator' THEN 24 WHEN 'putaway_operator' THEN 24 WHEN 'replenishment_operator' THEN 24 WHEN 'dispatch_operator' THEN 24 WHEN 'returns_operator' THEN 24 WHEN 'fleet_mechanic' THEN 24 WHEN 'picker' THEN 22 WHEN 'packer' THEN 22 WHEN 'receiver' THEN 22 WHEN 'returns_clerk' THEN 22 WHEN 'driver' THEN 20 WHEN 'forklift_operator' THEN 20 WHEN 'warehouse_administrator' THEN 24 ELSE 0 END))))$query$),

('onboarding',ARRAY['group_ceo','group_chro','country_hr_director','regional_hr_manager','hr_generalist']::text[],$query$SELECT count(*) FROM public.employees r JOIN public.sites home ON home.id=r.site_id WHERE upper(home.country)=$1 AND r.status='Pending Approval' AND r.id<>$2 AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$)
  ) registry(key,roles,query) WHERE actor.role=ANY(roles) AND key<>'price_finance' LOOP
    BEGIN
      EXECUTE q.query INTO n USING upper(p_country_code),actor.id,actor.name,actor.region_code,actor.role,actor.email;
      entries:=entries||jsonb_build_array(jsonb_build_object('key',q.key,'count',n,'status','ready'));
      total:=total+n;
    EXCEPTION WHEN insufficient_privilege OR undefined_table OR undefined_column OR undefined_function THEN
      entries:=entries||jsonb_build_array(jsonb_build_object('key',q.key,'count',null,'status','unavailable'));
      unavailable:=unavailable+1;
    END;
  END LOOP;

  -- 3. Price inbox (commercial approver or finance clearance)
  IF actor.role IN ('regional_merchandising_manager','country_commercial_director','country_managing_director','country_finance_director','group_ceo','group_cfo') THEN
    product_inbox:=public.get_my_price_approval_inbox(upper(p_country_code));
    IF actor.role IN ('country_finance_director','group_cfo') THEN
      n:=(product_inbox->>'financeCount')::bigint;
      entries:=entries||jsonb_build_array(jsonb_build_object('key','price_finance','count',n,'status','ready'));
    ELSE
      n:=(product_inbox->>'priceCount')::bigint;
      entries:=entries||jsonb_build_array(jsonb_build_object('key','price','count',n,'status','ready'));
    END IF;
    total:=total+n;
  END IF;

  RETURN jsonb_build_object('total',total,'queues',entries,'unavailable',unavailable,'checkedAt',statement_timestamp());
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_approval_inbox(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_approval_inbox(text) TO authenticated;

COMMIT;
