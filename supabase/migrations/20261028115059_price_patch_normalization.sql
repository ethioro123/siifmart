CREATE OR REPLACE FUNCTION private.guard_product_edit_request() RETURNS trigger LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   (CASE WHEN private.is_price_change(OLD.proposed_changes) THEN NOT coalesce((private.price_approval_route(OLD.id)->>'canReject')::boolean,false) ELSE NOT private.product_edit_region_scope(OLD.site_id) END) OR length(trim(coalesce(NEW.rejection_reason,'')))=0
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
 IF jsonb_typeof(NEW.proposed_changes)='object' THEN
  NEW.proposed_changes:=(SELECT coalesce(jsonb_object_agg(field.key,field.value),'{}') FROM jsonb_each(NEW.proposed_changes) field
   WHERE private.product_edit_patch(jsonb_build_object(field.key,field.value)) IS DISTINCT FROM
   (SELECT coalesce(jsonb_object_agg(k,to_jsonb(p)->k),'{}') FROM jsonb_object_keys(private.product_edit_patch(jsonb_build_object(field.key,field.value))) k));
 END IF;
 IF NEW.proposed_changes IS NULL OR jsonb_typeof(NEW.proposed_changes)<>'object'
 OR private.product_edit_patch(NEW.proposed_changes)='{}' THEN RAISE EXCEPTION 'No editable product fields supplied'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) k WHERE NOT k=ANY(ARRAY['name','sku','category','brand','description','image','size','unit','barcode','barcodes','barcodeType','price','costPrice','salePrice','isOnSale','minStock','maxStock','packQuantity','customAttributes','shelfPosition'])) THEN RAISE EXCEPTION 'Product proposal includes unauthorized fields'; END IF;
 IF private.is_price_change(NEW.proposed_changes) THEN
  IF NEW.layout_revision_id IS NOT NULL OR EXISTS(SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) k WHERE k<>ALL(ARRAY['price','costPrice','salePrice','isOnSale'])) THEN
   RAISE EXCEPTION 'Submit price changes separately from product details and shelf layouts'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(NEW.proposed_changes) field WHERE field.key IN ('price','costPrice','salePrice') AND (jsonb_typeof(field.value)<>'number' OR (field.value::text)::numeric<>round((field.value::text)::numeric))) THEN
   RAISE EXCEPTION 'Prices and costs must be whole numbers'; END IF;
  NEW.price_review_context:=jsonb_build_object('requesterRole',actor.role,'pricingBaseline',jsonb_build_object('price',p.price,'cost_price',p.cost_price,'sale_price',p.sale_price,'is_on_sale',p.is_on_sale));
 ELSE NEW.price_review_context:=NULL; END IF;
 NEW.requested_by_employee_id:=actor.id; NEW.requested_by:=actor.name;
 NEW.requested_at:=now(); NEW.product_edit_approvals:='[]';
 NEW.finance_approved_by_employee_id:=NULL; NEW.finance_approved_at:=NULL;
 NEW.product_edit_baseline:=(SELECT jsonb_object_agg(k,to_jsonb(p)->k) FROM jsonb_object_keys(private.product_edit_patch(NEW.proposed_changes)) k);
 SELECT upper(country),region_code INTO NEW.country_code,NEW.region_code FROM public.sites WHERE id=p.site_id;
 RETURN NEW;
END;
$function$
;
