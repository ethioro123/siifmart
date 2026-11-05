-- RLS and existing procurement triggers remain authoritative; the document is a single transaction.
CREATE FUNCTION public.save_purchase_order_document(p_id uuid,p_header jsonb,p_items jsonb,p_create boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE po public.purchase_orders%ROWTYPE; l jsonb; line public.po_items%ROWTYPE; allowed jsonb;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p_header) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Authenticated purchase document required'; END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO allowed FROM jsonb_each(p_header)
 WHERE key=ANY(ARRAY['po_number','site_id','supplier_id','supplier_name','order_date','status','total_amount','items_count','expected_delivery','shipping_cost','tax_amount','notes','payment_terms','incoterms','destination','discount','temp_req','shelf_life','dock_slot','requested_by','created_by','priority','currency','country_code','region_code','requires_hq_approval','purchase_requisition_id']);
 IF p_create THEN
  allowed:=jsonb_build_object('created_at',now(),'updated_at',now(),'order_date',current_date,'status','Draft','currency','ETB','country_code','ET')||allowed||jsonb_build_object('id',p_id);
  INSERT INTO public.purchase_orders SELECT (jsonb_populate_record(NULL::public.purchase_orders,allowed)).* RETURNING * INTO po;
 ELSE
  SELECT * INTO po FROM public.purchase_orders WHERE id=p_id FOR UPDATE;
  IF po.id IS NULL THEN RAISE EXCEPTION 'Purchase order unavailable'; END IF;
  IF p_items IS NOT NULL AND po.status NOT IN('Draft','Pending') THEN RAISE EXCEPTION 'Only unapproved lines can be replaced'; END IF;
  IF p_items IS NOT NULL THEN DELETE FROM public.po_items WHERE po_id=po.id; END IF;
  -- Origin/approval fields remain protected by the deployed procurement guard.
  po:=jsonb_populate_record(po,allowed);
  UPDATE public.purchase_orders SET supplier_id=po.supplier_id,supplier_name=po.supplier_name,order_date=po.order_date,status=po.status,total_amount=po.total_amount,
   items_count=po.items_count,expected_delivery=po.expected_delivery,shipping_cost=po.shipping_cost,tax_amount=po.tax_amount,notes=po.notes,payment_terms=po.payment_terms,
   incoterms=po.incoterms,destination=po.destination,discount=po.discount,temp_req=po.temp_req,shelf_life=po.shelf_life,dock_slot=po.dock_slot,
   requested_by=po.requested_by,priority=po.priority,currency=po.currency,requires_hq_approval=po.requires_hq_approval,updated_at=now() WHERE id=p_id RETURNING * INTO po;
 END IF;
 IF p_items IS NOT NULL THEN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Purchase order requires 1 to 500 lines'; END IF;
  FOR l IN SELECT value FROM jsonb_array_elements(p_items) LOOP
   SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO allowed FROM jsonb_each(l)
    WHERE key=ANY(ARRAY['product_id','product_name','sku','quantity','unit_cost','total_cost','retail_price','image','brand','size','unit','category','identity_type','pack_quantity','case_size','package_type','description','min_stock','max_stock','custom_attributes']);
   line:=jsonb_populate_record(NULL::public.po_items,jsonb_build_object('received_qty',0,'pack_quantity',1,'created_at',now())||allowed||jsonb_build_object('id',gen_random_uuid(),'po_id',po.id));
   INSERT INTO public.po_items SELECT line.*;
  END LOOP;
 END IF;
 RETURN jsonb_build_object('id',po.id,'po_number',po.po_number);
END $$;
REVOKE ALL ON FUNCTION public.save_purchase_order_document(uuid,jsonb,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_purchase_order_document(uuid,jsonb,jsonb,boolean) TO authenticated;
