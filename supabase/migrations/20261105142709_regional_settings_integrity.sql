BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS regions_unique_admin_hub ON public.regions(admin_hub_site_id) WHERE admin_hub_site_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS regions_unique_regional_manager ON public.regions(regional_manager_id) WHERE regional_manager_id IS NOT NULL;
CREATE OR REPLACE FUNCTION private.guard_region_relationships()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE hub public.sites; manager public.employees; home public.sites;
BEGIN
 IF NEW.admin_hub_site_id IS NOT NULL THEN
  SELECT * INTO hub FROM public.sites WHERE id=NEW.admin_hub_site_id FOR UPDATE;
  IF hub.id IS NULL OR hub.type NOT IN('Administration','Administrative') OR hub.status<>'Active'
   OR upper(hub.country) IS DISTINCT FROM upper(NEW.country) OR hub.code=upper(NEW.country)||'-HQ'
   OR (hub.region_code IS NOT NULL AND hub.region_code<>NEW.code)
   OR EXISTS(SELECT 1 FROM public.regions WHERE admin_hub_site_id=hub.id AND code<>NEW.code) THEN
   RAISE EXCEPTION 'Choose an active, unassigned administration hub in this country or retain this region hub' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NEW.regional_manager_id IS NOT NULL THEN
  SELECT * INTO manager FROM public.employees WHERE id=NEW.regional_manager_id FOR UPDATE;
  SELECT * INTO home FROM public.sites WHERE id=manager.site_id;
  IF manager.id IS NULL OR manager.role<>'regional_operations_manager' OR lower(manager.status)<>'active'
   OR upper(home.country) IS DISTINCT FROM upper(NEW.country)
   OR coalesce(manager.region_code,home.region_code) IS DISTINCT FROM NEW.code THEN
   RAISE EXCEPTION 'Regional Operations Manager must be active and assigned to this country and region' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION private.guard_region_relationships() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_region_relationships ON public.regions;
CREATE TRIGGER guard_region_relationships BEFORE INSERT OR UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION private.guard_region_relationships();
CREATE OR REPLACE FUNCTION private.preserve_regional_hub_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF EXISTS(SELECT 1 FROM public.regions r WHERE r.admin_hub_site_id=NEW.id AND
  (NEW.region_code IS DISTINCT FROM r.code OR upper(NEW.country) IS DISTINCT FROM upper(r.country)
   OR NEW.type NOT IN('Administration','Administrative') OR NEW.status<>'Active')) THEN
  RAISE EXCEPTION 'Reassign the regional administration hub before moving, reclassifying or closing this facility' USING ERRCODE='23514';
 END IF;
 IF NEW.code=upper(NEW.country)||'-HQ' AND NEW.region_code IS NOT NULL THEN
  RAISE EXCEPTION 'Country headquarters cannot be assigned as a regional facility' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION private.preserve_regional_hub_assignment() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS preserve_regional_hub_assignment ON public.sites;
CREATE TRIGGER preserve_regional_hub_assignment BEFORE UPDATE OF region_code,country,type,status ON public.sites FOR EACH ROW EXECUTE FUNCTION private.preserve_regional_hub_assignment();
CREATE OR REPLACE FUNCTION private.preserve_regional_manager_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE home public.sites;
BEGIN
 SELECT * INTO home FROM public.sites WHERE id=NEW.site_id;
 IF EXISTS(SELECT 1 FROM public.regions r WHERE r.regional_manager_id=NEW.id AND
  (NEW.role<>'regional_operations_manager' OR lower(NEW.status)<>'active'
   OR upper(home.country) IS DISTINCT FROM upper(r.country)
   OR coalesce(NEW.region_code,home.region_code) IS DISTINCT FROM r.code)) THEN
  RAISE EXCEPTION 'Unassign the regional manager before changing their placement, role or active status' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION private.preserve_regional_manager_assignment() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS preserve_regional_manager_assignment ON public.employees;
CREATE TRIGGER preserve_regional_manager_assignment BEFORE UPDATE OF site_id,region_code,role,status ON public.employees FOR EACH ROW EXECUTE FUNCTION private.preserve_regional_manager_assignment();
-- This private aggregate returns a region summary, never individual orders. Its explicit
-- actor checks allow complete totals without depending on caller-specific order-row visibility.
CREATE OR REPLACE FUNCTION private.regional_budget_summary(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
DECLARE r public.regions; actor public.employees; home public.sites; month_start date; spend numeric; budget numeric; percent_used numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.regions WHERE code=p_code;
 IF r.code IS NULL THEN RAISE EXCEPTION 'Region unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO home FROM public.sites WHERE id=actor.site_id;
 IF actor.role<>'group_ceo' AND NOT coalesce((
   upper(home.country)=upper(r.country) AND (
    actor.role IN('country_managing_director','country_operations_director','country_finance_director','country_commercial_director','country_supply_chain_director','group_coo','group_cfo','group_cco','group_csco')
    OR (actor.role IN('regional_operations_manager','regional_procurement_manager','regional_finance_manager','regional_supply_chain_manager','regional_logistics_manager') AND coalesce(actor.region_code,home.region_code)=r.code)
   )),false) THEN RAISE EXCEPTION 'Regional budget is outside your authority' USING ERRCODE='42501'; END IF;
 month_start:=date_trunc('month',statement_timestamp() AT TIME ZONE CASE r.country WHEN 'RW' THEN 'Africa/Kigali' ELSE 'Africa/Nairobi' END)::date;
 SELECT coalesce(sum(po.total_amount),0) INTO spend FROM public.purchase_orders po LEFT JOIN public.sites s ON s.id=po.site_id
 WHERE coalesce(po.region_code,s.region_code)=r.code AND upper(po.country_code)=upper(r.country)
 AND po.order_date>=month_start AND po.order_date<(month_start+interval '1 month')::date
 AND po.status IN('Approved','Ordered','Partially Received','Received');
 budget:=coalesce(r.monthly_procurement_budget,0);
 percent_used:=CASE WHEN budget>0 THEN spend/budget*100 ELSE 0 END;
 RETURN jsonb_build_object('regionCode',r.code,'regionName',r.name,'currency',r.default_currency,'monthlyBudget',budget,
  'autonomousPoLimit',r.autonomous_po_limit,'currentMonthSpend',spend,'remainingBudget',greatest(0,budget-spend),
  'percentUsed',percent_used,'isOverBudget',budget>0 AND spend>=budget,'isNearCap',budget>0 AND percent_used>=85);
END;
$fn$;
REVOKE ALL ON FUNCTION private.regional_budget_summary(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.regional_budget_summary(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_region_budget_status(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
 SELECT private.regional_budget_summary(p_code);
$fn$;
REVOKE ALL ON FUNCTION public.get_region_budget_status(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_region_budget_status(text) TO authenticated;
-- Include older orders without an explicit region in the approval-time budget check,
-- using their site region as the same fallback used by the summary above.
DO $patch$
DECLARE definition text:=pg_get_functiondef('public.enforce_regional_po_approval_scope_and_budget()'::regprocedure);
 old_filter text:='AND po.region_code = v_region_code';
 new_filter text:='AND coalesce(po.region_code, (SELECT budget_site.region_code FROM public.sites budget_site WHERE budget_site.id=po.site_id)) = v_region_code AND upper(po.country_code)=upper(NEW.country_code)';
BEGIN
 IF position(old_filter IN definition)>0 THEN EXECUTE replace(definition,old_filter,new_filter);
 ELSIF position(new_filter IN definition)=0 THEN RAISE EXCEPTION 'Unexpected regional budget guard definition'; END IF;
END;
$patch$;
COMMIT;
