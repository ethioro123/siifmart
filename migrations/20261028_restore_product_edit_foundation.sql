BEGIN;
-- Restore the missing production prerequisite for validated planogram decisions.
-- Three independent regional approvals for existing product catalog edits.
CREATE TABLE IF NOT EXISTS private.product_edit_votes (
 request_id uuid NOT NULL REFERENCES public.inventory_requests(id) ON DELETE CASCADE,
 employee_id uuid NOT NULL REFERENCES public.employees(id),
 role text NOT NULL CHECK (role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')),
 employee_name text NOT NULL, approved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(request_id,role), UNIQUE(request_id,employee_id)
);
CREATE INDEX IF NOT EXISTS product_edit_votes_employee_idx ON private.product_edit_votes(employee_id);
ALTER TABLE private.product_edit_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.product_edit_votes FROM PUBLIC, anon, authenticated;
ALTER TABLE public.inventory_requests
 ADD COLUMN IF NOT EXISTS product_edit_approvals jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN IF NOT EXISTS product_edit_baseline jsonb;

CREATE OR REPLACE FUNCTION private.product_edit_patch(proposal jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(mapping.dbkey, proposal->mapping.appkey),'{}')
 FROM (VALUES ('name','name'),('sku','sku'),('category','category'),('brand','brand'),('description','description'),('image','image'),('size','size'),('unit','unit'),('barcode','barcode'),('barcodes','barcodes'),('barcodeType','barcode_type'),('price','price'),('costPrice','cost_price'),('salePrice','sale_price'),('isOnSale','is_on_sale'),('minStock','min_stock'),('maxStock','max_stock'),('packQuantity','pack_quantity'),('customAttributes','custom_attributes'),('shelfPosition','shelf_position')) mapping(appkey,dbkey)
 WHERE proposal ? mapping.appkey;
$$;
REVOKE ALL ON FUNCTION private.product_edit_patch(jsonb) FROM PUBLIC,anon,authenticated;

DROP POLICY IF EXISTS product_edit_regional_read ON public.inventory_requests;
CREATE POLICY product_edit_regional_read ON public.inventory_requests FOR SELECT TO authenticated
 USING(change_type='edit' AND private.product_edit_region_scope(site_id));
DROP POLICY IF EXISTS product_edit_regional_prepare ON public.inventory_requests;
CREATE POLICY product_edit_regional_prepare ON public.inventory_requests FOR INSERT TO authenticated
 WITH CHECK(change_type='edit' AND status='pending' AND private.product_edit_region_scope(site_id));
DROP POLICY IF EXISTS product_edit_regional_products_read ON public.products;
CREATE POLICY product_edit_regional_products_read ON public.products FOR SELECT TO authenticated
 USING(private.product_edit_region_scope(site_id::text));

CREATE OR REPLACE FUNCTION private.product_edit_decision_matches(p_product_id uuid,p_site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.inventory_requests r
 WHERE r.id::text=current_setting('app.product_edit_decision_id',true)
 AND r.product_id=p_product_id::text AND r.site_id=p_site_id::text
 AND r.change_type='edit' AND r.status='pending'
 AND private.product_edit_region_scope(r.site_id)
 AND (SELECT count(*) FROM private.product_edit_votes v WHERE v.request_id=r.id)=3);
$$;
REVOKE ALL ON FUNCTION private.product_edit_decision_matches(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.guard_product_edit_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products%ROWTYPE; actor public.employees%ROWTYPE; votes jsonb;
BEGIN
 IF TG_OP='UPDATE' AND OLD.change_type<>'edit' AND NEW.change_type<>'edit' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' AND NEW.change_type<>'edit' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.status<>'pending' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Completed product decisions are immutable'; END IF;
  IF (NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at)
   AND NOT private.product_edit_decision_matches(OLD.product_id::uuid,OLD.site_id::uuid) THEN
   RAISE EXCEPTION 'Approval identity is server controlled'; END IF;
  IF NEW.status='rejected' AND OLD.status='pending' AND (
   NOT private.product_edit_region_scope(OLD.site_id) OR length(trim(coalesce(NEW.rejection_reason,'')))=0
   OR NEW.rejected_by IS DISTINCT FROM (SELECT name FROM public.employees WHERE id=auth.uid())) THEN
   RAISE EXCEPTION 'Regional manager and a reason required to reject product edits'; END IF;
  IF (to_jsonb(NEW)-ARRAY['status','approved_by','approved_at','rejection_reason','rejected_by','rejected_at','finance_approved_by_employee_id','finance_approved_at','product_edit_approvals'])
   IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','approved_by','approved_at','rejection_reason','rejected_by','rejected_at','finance_approved_by_employee_id','finance_approved_at','product_edit_approvals']) THEN
   RAISE EXCEPTION 'Product edit proposals are immutable; submit a new request';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('employeeId',v.employee_id,'name',v.employee_name,'role',v.role,'approvedAt',v.approved_at) ORDER BY v.role),'[]')
   INTO votes FROM private.product_edit_votes v WHERE v.request_id=OLD.id;
  IF NEW.product_edit_approvals IS DISTINCT FROM votes THEN RAISE EXCEPTION 'Approval records are server controlled'; END IF;
  IF NEW.status='approved' AND OLD.status IS DISTINCT FROM 'approved'
   AND NOT private.product_edit_decision_matches(OLD.product_id::uuid,OLD.site_id::uuid) THEN
   RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT product.* INTO p FROM public.products product WHERE product.id::text=NEW.product_id AND product.site_id::text=NEW.site_id;
 IF actor.id IS NULL OR p.id IS NULL OR NEW.status<>'pending' OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
  RAISE EXCEPTION 'Product edits must be submitted as pending proposals by an active employee';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.sites target LEFT JOIN public.sites home ON home.id=actor.site_id
 WHERE target.id=p.site_id AND (upper(target.country)=upper(home.country) OR (actor.role='group_ceo' AND public.is_country_in_my_authorized_scope(target.country)))) THEN
  RAISE EXCEPTION 'Product edit is outside your country';
 END IF;
 IF NEW.proposed_changes IS NULL OR jsonb_typeof(NEW.proposed_changes)<>'object'
 OR private.product_edit_patch(NEW.proposed_changes)='{}' THEN RAISE EXCEPTION 'No editable product fields supplied'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) k WHERE NOT k=ANY(ARRAY['name','sku','category','brand','description','image','size','unit','barcode','barcodes','barcodeType','price','costPrice','salePrice','isOnSale','minStock','maxStock','packQuantity','customAttributes','shelfPosition'])) THEN RAISE EXCEPTION 'Product proposal includes unauthorized fields'; END IF;
 NEW.requested_by_employee_id:=actor.id; NEW.requested_by:=actor.name;
 NEW.requested_at:=now(); NEW.product_edit_approvals:='[]';
 NEW.finance_approved_by_employee_id:=NULL; NEW.finance_approved_at:=NULL;
 NEW.product_edit_baseline:=(SELECT jsonb_object_agg(k,to_jsonb(p)->k) FROM jsonb_object_keys(private.product_edit_patch(NEW.proposed_changes)) k);
 SELECT upper(country),region_code INTO NEW.country_code,NEW.region_code FROM public.sites WHERE id=p.site_id;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_product_edit_request() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS z_product_edit_request_guard ON public.inventory_requests;
CREATE TRIGGER z_product_edit_request_guard BEFORE INSERT OR UPDATE ON public.inventory_requests
 FOR EACH ROW EXECUTE FUNCTION private.guard_product_edit_request();

CREATE OR REPLACE FUNCTION public.approve_product_edit(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; r public.inventory_requests%ROWTYPE;
 p public.products%ROWTYPE; next_product public.products%ROWTYPE; patch jsonb;
 votes jsonb; vote_count integer; baseline jsonb; assignments text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR r.change_type<>'edit' OR r.status<>'pending'
 OR NOT private.product_edit_region_scope(r.site_id) THEN RAISE EXCEPTION 'Product edit approval is outside your regional role or territory'; END IF;
 IF actor.id=r.requested_by_employee_id OR lower(actor.name)=lower(r.requested_by) OR lower(actor.email)=lower(r.requested_by) THEN
  RAISE EXCEPTION 'Requesters cannot approve their own product edits'; END IF;
 SELECT * INTO p FROM public.products WHERE id::text=r.product_id AND site_id::text=r.site_id FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Product no longer exists at this site'; END IF;
 patch:=private.product_edit_patch(r.proposed_changes);
 SELECT jsonb_object_agg(k,to_jsonb(p)->k) INTO baseline FROM jsonb_object_keys(patch) k;
 IF r.product_edit_baseline IS NULL OR baseline IS DISTINCT FROM r.product_edit_baseline THEN
  RAISE EXCEPTION 'Product changed since this proposal; submit a fresh edit'; END IF;
 next_product:=jsonb_populate_record(p,patch);
 IF next_product.price<0 OR next_product.cost_price<0 OR next_product.sale_price<0
 OR next_product.min_stock<0 OR next_product.max_stock<0 OR next_product.max_stock<next_product.min_stock
 OR length(trim(next_product.name))=0 OR length(trim(next_product.sku))=0 THEN RAISE EXCEPTION 'Invalid product values or stock thresholds'; END IF;
 IF patch ?| ARRAY['price','cost_price','sale_price','is_on_sale'] THEN
  IF (CASE WHEN next_product.is_on_sale AND next_product.sale_price>0 THEN next_product.sale_price ELSE next_product.price END)<=0 THEN
   RAISE EXCEPTION 'Selling price must be positive'; END IF;
  IF next_product.cost_price>0 AND (1-next_product.cost_price/(CASE WHEN next_product.is_on_sale AND next_product.sale_price>0 THEN next_product.sale_price ELSE next_product.price END))*100<15
  AND r.finance_approved_by_employee_id IS NULL THEN RAISE EXCEPTION 'Finance co-approval is required below the margin floor'; END IF;
 END IF;
 INSERT INTO private.product_edit_votes(request_id,employee_id,role,employee_name)
 VALUES(r.id,actor.id,actor.role,actor.name) ON CONFLICT(request_id,role) DO NOTHING;
 SELECT count(*),jsonb_agg(jsonb_build_object('employeeId',v.employee_id,'name',v.employee_name,'role',v.role,'approvedAt',v.approved_at) ORDER BY v.role)
 INTO vote_count,votes FROM private.product_edit_votes v WHERE v.request_id=r.id;
 UPDATE public.inventory_requests SET product_edit_approvals=votes WHERE id=r.id;
 IF vote_count<3 THEN RETURN jsonb_build_object('applied',false,'approvalCount',vote_count); END IF;
 IF EXISTS(SELECT 1 FROM private.product_edit_votes v JOIN public.employees e ON e.id=v.employee_id
 JOIN public.sites home ON home.id=e.site_id JOIN public.sites target ON target.id=p.site_id
 WHERE v.request_id=r.id AND (lower(coalesce(e.status,'active'))<>'active' OR e.role<>v.role
 OR e.region_code IS DISTINCT FROM target.region_code OR home.region_code IS DISTINCT FROM target.region_code
 OR upper(home.country) IS DISTINCT FROM upper(target.country))) THEN RAISE EXCEPTION 'An approver no longer holds the authorized regional role; submit a fresh edit'; END IF;
 PERFORM set_config('app.product_edit_decision_id',r.id::text,true);
 -- Column names originate exclusively from the fixed mapping above; values remain parameters.
 SELECT string_agg(format('%I = ($1).%I',k,k),',') INTO assignments FROM jsonb_object_keys(patch) k;
 EXECUTE format('UPDATE public.products SET %s WHERE id=$2',assignments) USING next_product,p.id;
 UPDATE public.inventory_requests SET status='approved',approved_by=actor.name,approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.product_edit_decision_id','',true);
 RETURN jsonb_build_object('applied',true,'approvalCount',3);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_product_edit(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_product_edit(uuid) TO authenticated;

-- Add the edit gate without replacing existing operational authorization logic.
DO $migration$
DECLARE definition text; needle text;
BEGIN
 definition:=pg_get_functiondef('public.enforce_product_update_restrictions()'::regprocedure);
 needle:=$needle$  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;$needle$;
 IF position(needle IN definition)=0 THEN RAISE EXCEPTION 'Unexpected product guard definition'; END IF;
 EXECUTE replace(definition,needle,needle || $gate$
  IF private.product_edit_decision_matches(OLD.id,OLD.site_id) THEN RETURN NEW; END IF;
  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit OR OLD.barcode IS DISTINCT FROM NEW.barcode OR OLD.barcodes IS DISTINCT FROM NEW.barcodes OR OLD.barcode_type IS DISTINCT FROM NEW.barcode_type OR OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR OLD.shelf_position IS DISTINCT FROM NEW.shelf_position THEN
    RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;
$gate$);
 definition:=pg_get_functiondef('public.enforce_inventory_requests_zero_trust()'::regprocedure);
 needle:=$needle$  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN$needle$;
 IF position(needle IN definition)=0 THEN RAISE EXCEPTION 'Unexpected inventory request guard definition'; END IF;
 EXECUTE replace(definition,needle,needle || $gate$
    IF OLD.change_type='edit' THEN
      IF NOT private.product_edit_decision_matches(OLD.product_id::uuid,OLD.site_id::uuid) THEN
        RAISE EXCEPTION 'Three regional approvals required for product edits';
      END IF;
      NEW.approved_at:=now(); RETURN NEW;
    END IF;$gate$);
END;
$migration$;

CREATE OR REPLACE FUNCTION public.reject_product_edit(p_request_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id FOR UPDATE;
 IF r.id IS NULL OR r.change_type<>'edit' OR r.status<>'pending'
 OR NOT private.product_edit_region_scope(r.site_id) OR length(trim(coalesce(p_reason,'')))=0 THEN
  RAISE EXCEPTION 'Regional manager and a reason required to reject pending product edits'; END IF;
 UPDATE public.inventory_requests SET status='rejected',rejection_reason=trim(p_reason),
 rejected_by=(SELECT name FROM public.employees WHERE id=auth.uid()),rejected_at=now() WHERE id=r.id;
END;
$$;
REVOKE ALL ON FUNCTION public.reject_product_edit(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reject_product_edit(uuid,text) TO authenticated;

COMMIT;
