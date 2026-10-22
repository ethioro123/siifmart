-- Keep procurement requirements consistent with confirmed item specifications.
BEGIN;
CREATE OR REPLACE FUNCTION private.po_storage_temperature(p_storage text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN lower(trim(p_storage)) LIKE 'chilled%' OR lower(trim(p_storage)) LIKE 'refrigerated%' THEN 'Chilled'
    WHEN lower(trim(p_storage)) LIKE 'frozen%' THEN 'Frozen'
    WHEN lower(trim(p_storage)) LIKE 'ambient%' THEN 'Ambient'
    ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION private.po_shelf_life_days(p_value text)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE result numeric;
BEGIN
  IF p_value IS NULL OR trim(p_value) = '' THEN RETURN NULL; END IF;
  IF trim(p_value) !~* '^[0-9]+([[:space:]]*days?)?$' THEN
    RAISE EXCEPTION 'Shelf life must be a positive whole number of days' USING ERRCODE = '23514';
  END IF;
  result := substring(trim(p_value) FROM '^[0-9]+')::numeric;
  IF result <= 0 OR result > 9007199254740991 THEN
    RAISE EXCEPTION 'Shelf life must be a positive whole number of days' USING ERRCODE = '23514';
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_po_item_delivery(p_attributes jsonb, p_temperature text, p_minimum_life text)
RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE storage jsonb := coalesce(p_attributes -> 'storage', '{}'::jsonb);
DECLARE temperature text;
DECLARE minimum_days numeric;
DECLARE total_days numeric;
BEGIN
  temperature := private.po_storage_temperature(storage ->> 'type');
  minimum_days := private.po_shelf_life_days(p_minimum_life);
  IF temperature IS NOT NULL AND temperature <> coalesce(p_temperature, 'Ambient') THEN
    RAISE EXCEPTION 'Item storage temperature % conflicts with PO delivery temperature %. Separate incompatible temperature groups into different orders.', temperature, p_temperature USING ERRCODE = '23514';
  END IF;
  IF storage ->> 'isPerishable' = 'true' THEN
    IF minimum_days IS NULL THEN
      RAISE EXCEPTION 'Minimum remaining shelf life at delivery is required for perishable items' USING ERRCODE = '23514';
    END IF;
    total_days := private.po_shelf_life_days(storage ->> 'shelfLifeDays');
    IF total_days IS NOT NULL AND minimum_days > total_days THEN
      RAISE EXCEPTION 'Minimum remaining shelf life exceeds total product shelf life' USING ERRCODE = '23514';
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_po_item_requirements()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE order_temperature text;
DECLARE minimum_life text;
DECLARE catalog_attributes jsonb;
DECLARE catalog_price numeric;
BEGIN
  SELECT temp_req, shelf_life INTO order_temperature, minimum_life
    FROM public.purchase_orders WHERE id = NEW.po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order unavailable' USING ERRCODE = '42501'; END IF;
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 OR NEW.quantity::text IN ('NaN','Infinity','-Infinity')
     OR NEW.unit_cost IS NULL OR NEW.unit_cost <= 0 OR NEW.unit_cost::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Item quantity and buying cost must be positive finite numbers' USING ERRCODE = '23514';
  END IF;
  IF NEW.product_id IS NOT NULL THEN
    SELECT custom_attributes, price INTO catalog_attributes, catalog_price
      FROM public.products WHERE id = NEW.product_id AND approval_status = 'approved';
    IF NOT FOUND THEN RAISE EXCEPTION 'An approved catalog product is required' USING ERRCODE = '23514'; END IF;
    -- A PO cannot replace approved master specifications or set a new selling price.
    NEW.custom_attributes := coalesce(catalog_attributes, '{}'::jsonb);
    NEW.retail_price := coalesce(catalog_price, 0);
  ELSE
    NEW.retail_price := 0;
    IF NEW.custom_attributes #>> '{storage,requirementsConfirmed}' IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Confirm new product storage and handling requirements' USING ERRCODE = '23514';
    END IF;
    IF NEW.custom_attributes #>> '{storage,isPerishable}' = 'true'
       AND private.po_shelf_life_days(NEW.custom_attributes #>> '{storage,shelfLifeDays}') IS NULL THEN
      RAISE EXCEPTION 'Total product shelf life is required for a new perishable item' USING ERRCODE = '23514';
    END IF;
  END IF;
  PERFORM private.validate_po_item_delivery(NEW.custom_attributes, order_temperature, minimum_life);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_po_delivery_requirements()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE item record;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.temp_req IS NOT DISTINCT FROM OLD.temp_req
     AND NEW.shelf_life IS NOT DISTINCT FROM OLD.shelf_life AND NEW.status NOT IN ('Approved','Ordered') THEN RETURN NEW; END IF;
  PERFORM private.po_shelf_life_days(NEW.shelf_life);
  IF coalesce(NEW.temp_req, 'Ambient') NOT IN ('Ambient','Chilled','Frozen') THEN
    RAISE EXCEPTION 'Choose Ambient, Chilled or Frozen delivery' USING ERRCODE = '23514';
  END IF;
  FOR item IN SELECT custom_attributes FROM public.po_items WHERE po_id = NEW.id LOOP
    PERFORM private.validate_po_item_delivery(item.custom_attributes, NEW.temp_req, NEW.shelf_life);
  END LOOP;
  RETURN NEW;
END;
$$;

-- New unpriced product placeholders must go through existing product approval.
CREATE OR REPLACE FUNCTION private.hold_unpriced_product_for_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF coalesce(NEW.price, 0) <= 0 THEN
    IF TG_OP = 'UPDATE' AND NEW.approval_status = 'approved' AND OLD.approval_status <> 'approved' THEN
      RAISE EXCEPTION 'Set a retail price before approving the product' USING ERRCODE = '23514';
    END IF;
    NEW.approval_status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.po_storage_temperature(text), private.po_shelf_life_days(text), private.validate_po_item_delivery(jsonb,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.po_storage_temperature(text), private.po_shelf_life_days(text), private.validate_po_item_delivery(jsonb,text,text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.guard_po_item_requirements(), private.guard_po_delivery_requirements(), private.hold_unpriced_product_for_approval() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_po_item_requirements BEFORE INSERT OR UPDATE OF product_id, custom_attributes, unit_cost, quantity, retail_price, po_id ON public.po_items
  FOR EACH ROW EXECUTE FUNCTION private.guard_po_item_requirements();
CREATE TRIGGER guard_po_delivery_requirements BEFORE INSERT OR UPDATE OF temp_req, shelf_life, status ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION private.guard_po_delivery_requirements();
CREATE TRIGGER hold_unpriced_product_for_approval BEFORE INSERT OR UPDATE OF price, approval_status ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.hold_unpriced_product_for_approval();
COMMIT;
