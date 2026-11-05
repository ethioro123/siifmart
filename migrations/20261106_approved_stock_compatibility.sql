CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp_role text;
  emp_id uuid;
  has_active_job boolean;
  decision_kind text;
BEGIN
 IF current_setting('siifmart.stock_command',true)='adjustment' AND EXISTS(SELECT 1 FROM private.inventory_adjustment_posts a WHERE a.request_id::text=current_setting('siifmart.inventory_adjustment',true) AND a.product_id=OLD.id AND a.actor_id=auth.uid() AND a.posted_at=transaction_timestamp() AND NEW.stock=OLD.stock+a.quantity) AND (to_jsonb(NEW)-ARRAY['stock','updated_at','stock_updated_at'])=(to_jsonb(OLD)-ARRAY['stock','updated_at','stock_updated_at']) THEN RETURN NEW; END IF;

  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF private.product_edit_decision_matches(OLD.id, OLD.site_id) THEN RETURN NEW; END IF;

  -- Allow stock-only decrements executed through the trusted pos_decrement_stock RPC
  IF current_setting('app.pos_sale_stock_decrement', true) = OLD.id::text
     AND (to_jsonb(NEW) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at'])
       = (to_jsonb(OLD) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at']) THEN
    RETURN NEW;
  END IF;

  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit OR OLD.barcode IS DISTINCT FROM NEW.barcode OR OLD.barcodes IS DISTINCT FROM NEW.barcodes OR OLD.barcode_type IS DISTINCT FROM NEW.barcode_type OR OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR OLD.shelf_position IS DISTINCT FROM NEW.shelf_position THEN
    RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;

  -- Allow only this transaction's verified intake to change receipt stock fields.
  IF (to_jsonb(NEW)-ARRAY['stock','status','pos_received_at','pos_received_by','updated_at'])
     = (to_jsonb(OLD)-ARRAY['stock','status','pos_received_at','pos_received_by','updated_at'])
     AND EXISTS(SELECT 1 FROM private.transfer_intake_posts r
       WHERE r.job_id=nullif(current_setting('siifmart.transfer_intake_job',true),'')::uuid
       AND r.site_id=OLD.site_id AND r.employee_id=auth.uid() AND r.posted_at=transaction_timestamp()
       AND r.items @> jsonb_build_array(jsonb_build_object('productId',OLD.id))) THEN RETURN NEW; END IF;
  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF private.merchandising_decision_matches(OLD.id, OLD.site_id) THEN
    SELECT adjustment_reason INTO decision_kind
      FROM public.inventory_requests
      WHERE id::text = current_setting('app.merchandising_decision_id', true);
    IF decision_kind LIKE 'PRICE_CHANGE%'
       AND (to_jsonb(NEW) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    IF decision_kind LIKE 'MERCHANDISING:%'
       AND (to_jsonb(NEW) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Merchandising decision attempted unrelated product fields';
  END IF;

  IF emp_role = 'group_ceo' THEN RETURN NEW; END IF;
  IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
      OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale)
     AND emp_role NOT IN ('country_commercial_director', 'procurement', 'group_ceo') THEN
    RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
  END IF;
  IF (OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku
      OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand
      OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit
      OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image
      OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes
      OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock
      OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity)
     AND emp_role NOT IN ('regional_operations_manager', 'group_ceo', 'country_managing_director') THEN
    RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
  END IF;
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    IF emp_role IN ('group_ceo', 'country_managing_director', 'inventory_controller', 'supply_chain_director') THEN
      NULL;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.job_assignments ja
        JOIN public.wms_jobs j ON j.id = ja.job_id
        WHERE ja.employee_id = emp_id
          AND (j.site_id::text = OLD.site_id::text OR j.dest_site_id::text = OLD.site_id::text)
          AND j.status IN ('Pending', 'In Progress', 'Active', 'In-Progress')
      ) INTO has_active_job;
      IF NOT has_active_job AND emp_role NOT IN ('store_manager', 'warehouse_manager', 'country_operations_director') THEN
        RAISE EXCEPTION 'Direct stock modification is prohibited. Stock adjustments must be submitted via Inventory Requests for approval or processed via active WMS jobs.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

