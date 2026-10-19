-- Transfer receipt: let an authorised destination manager materialise a missing
-- destination product record without opening products INSERT RLS.
--
-- Problem: products INSERT RLS (products_insert_scoped) is admin-only, so a branch
-- manager receiving a transfer whose SKUs do not yet exist at the destination site
-- gets 42501 and the receipt is halted.
--
-- Fix: a SECURITY DEFINER RPC that, for ONE sku on ONE open transfer, creates a
-- zero-stock product row at the destination site. Guard rails:
--   * caller must be an active manager whose authorised scope includes the destination site
--   * the transfer (wms_jobs TRANSFER/DISPATCH or transfers row) must be open, target that
--     destination, and actually contain the SKU
--   * source and destination sites must be in the same country (no cross-border copies)
--   * master data and prices are copied from the source/template product, never from the client
--   * stock is created at 0; stock is added afterwards by the existing guarded update path
--   * the action is written to system_logs
-- Idempotent: returns the existing destination row if one already exists.

CREATE OR REPLACE FUNCTION public.ensure_transfer_receipt_product(p_transfer_id uuid, p_sku text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_sku        text := upper(regexp_replace(coalesce(p_sku, ''), '[-\s]', '', 'g'));
  v_actor_name text;
  v_dest       uuid;
  v_source     uuid;
  v_status     text;
  v_items      jsonb;
  v_item       jsonb;
  v_dest_cc    text;
  v_src_cc     text;
  v_tpl        public.products%ROWTYPE;
  v_existing   uuid;
  v_new_id     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF v_sku = '' THEN
    RAISE EXCEPTION 'SKU is required' USING ERRCODE = '22023';
  END IF;

  SELECT e.name INTO v_actor_name
  FROM public.employees e
  WHERE e.id = v_uid AND COALESCE(lower(e.status), 'active') = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active employee profile required' USING ERRCODE = '42501';
  END IF;

  -- Locate the open transfer (WMS job first, then transfers table).
  SELECT j.dest_site_id, j.source_site_id, COALESCE(j.transfer_status, j.status), j.line_items
    INTO v_dest, v_source, v_status, v_items
  FROM public.wms_jobs j
  WHERE j.id = p_transfer_id AND j.type IN ('TRANSFER', 'DISPATCH');

  IF NOT FOUND THEN
    SELECT t.dest_site_id, t.source_site_id, COALESCE(t.transfer_status, t.status), t.items
      INTO v_dest, v_source, v_status, v_items
    FROM public.transfers t
    WHERE t.id = p_transfer_id;
  END IF;

  IF v_dest IS NULL THEN
    RAISE EXCEPTION 'Transfer not found or has no destination' USING ERRCODE = '42501';
  END IF;
  IF v_status IN ('Received', 'Completed', 'Cancelled', 'Rejected') THEN
    RAISE EXCEPTION 'Transfer is no longer open for receiving' USING ERRCODE = '42501';
  END IF;

  IF NOT (public.is_manager() AND public.is_site_in_my_authorized_scope(v_dest::text, NULL)) THEN
    RAISE EXCEPTION 'Not authorised to receive stock at this site' USING ERRCODE = '42501';
  END IF;

  -- The SKU must be on this transfer.
  SELECT li INTO v_item
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_items) = 'array' THEN v_items ELSE '[]'::jsonb END) li
  WHERE upper(regexp_replace(coalesce(li->>'sku', ''), '[-\s]', '', 'g')) = v_sku
  LIMIT 1;
  IF v_item IS NULL THEN
    RAISE EXCEPTION 'SKU % is not part of this transfer', p_sku USING ERRCODE = '42501';
  END IF;

  -- Country sovereignty: never copy across borders.
  SELECT upper(country) INTO v_dest_cc FROM public.sites WHERE id = v_dest;
  SELECT upper(country) INTO v_src_cc FROM public.sites WHERE id = v_source;
  IF v_dest_cc IS NULL OR (v_src_cc IS NOT NULL AND v_src_cc <> v_dest_cc) THEN
    RAISE EXCEPTION 'Cross-country product creation is not allowed' USING ERRCODE = '42501';
  END IF;

  -- Idempotent: reuse an existing destination row.
  SELECT p.id INTO v_existing
  FROM public.products p
  WHERE p.site_id = v_dest
    AND upper(regexp_replace(p.sku, '[-\s]', '', 'g')) = v_sku
  ORDER BY p.stock DESC NULLS LAST
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Template: source-site product first, otherwise any product with this SKU in the same country.
  SELECT p.* INTO v_tpl
  FROM public.products p
  JOIN public.sites s ON s.id = p.site_id
  WHERE upper(regexp_replace(p.sku, '[-\s]', '', 'g')) = v_sku
    AND upper(s.country) = v_dest_cc
  ORDER BY (p.site_id = v_source) DESC, p.created_at ASC
  LIMIT 1;

  INSERT INTO public.products (
    site_id, name, sku, category, price, cost_price, stock, status,
    barcode, barcodes, brand, size, unit, image, description, custom_attributes,
    min_stock, max_stock, pack_quantity, product_id, master_id, created_by
  ) VALUES (
    v_dest,
    COALESCE(v_tpl.name, NULLIF(v_item->>'name', ''), v_sku),
    v_sku,
    COALESCE(v_tpl.category, NULLIF(v_item->>'category', ''), 'Uncategorized'),
    COALESCE(v_tpl.price,
             CASE WHEN (v_item->>'price') ~ '^[0-9]+(\.[0-9]+)?$' THEN (v_item->>'price')::numeric END, 0),
    COALESCE(v_tpl.cost_price,
             CASE WHEN (v_item->>'costPrice') ~ '^[0-9]+(\.[0-9]+)?$' THEN (v_item->>'costPrice')::numeric END, 0),
    0,
    'active',
    COALESCE(v_tpl.barcode, NULLIF(v_item->>'barcode', '')),
    v_tpl.barcodes,
    COALESCE(v_tpl.brand, NULLIF(v_item->>'brand', '')),
    COALESCE(v_tpl.size, NULLIF(v_item->>'size', '')),
    COALESCE(v_tpl.unit, NULLIF(v_item->>'unit', ''), 'pcs'),
    COALESCE(v_tpl.image, NULLIF(v_item->>'image', '')),
    v_tpl.description,
    v_tpl.custom_attributes,
    COALESCE(v_tpl.min_stock, 5),
    v_tpl.max_stock,
    v_tpl.pack_quantity,
    v_tpl.product_id,
    v_tpl.master_id,
    v_actor_name
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.system_logs (
    user_name, action, details, module, entity_type, entity_id,
    performed_by, site_id, country_code, employee_id, metadata
  ) VALUES (
    v_actor_name,
    'Transfer Receipt Product Created',
    format('Created destination product %s at site %s while receiving transfer %s', v_sku, v_dest, p_transfer_id),
    'Inventory', 'product', v_new_id::text,
    v_actor_name, v_dest::text, v_dest_cc, v_uid::text,
    jsonb_build_object('transfer_id', p_transfer_id, 'sku', v_sku, 'source_site_id', v_source,
                       'template_product_id', v_tpl.id)
  );

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_transfer_receipt_product(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_transfer_receipt_product(uuid, text) TO authenticated;
