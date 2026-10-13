-- ============================================================================
-- Migration: 20261014_sku_merge_procedure.sql
-- Description: Zero-Trust Master Catalog Unification RPC.
--              Merges duplicate legacy SKUs into a single surviving Master SKU,
--              consolidating physical stock, repointing historical transactions,
--              merging all barcode aliases, and marking the deprecated master as MERGED.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.merge_duplicate_product_sku(
  p_country text,
  p_surviving_sku text,
  p_deprecated_sku text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surviving_master_id uuid;
  v_deprecated_master_id uuid;
  v_dep_rec RECORD;
  v_surv_rec RECORD;
  v_merged_stock numeric := 0;
  v_sites_affected integer := 0;
BEGIN
  -- 1. Security & Sovereignty checks
  IF NOT public.is_hq_executive() THEN
    RAISE EXCEPTION 'Unauthorized: Only HQ Executives can merge product SKUs';
  END IF;

  IF p_surviving_sku = p_deprecated_sku THEN
    RAISE EXCEPTION 'Surviving SKU and Deprecated SKU cannot be the same';
  END IF;

  -- 2. Fetch master catalog records if available
  BEGIN
    SELECT id INTO v_surviving_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_surviving_sku;

    SELECT id INTO v_deprecated_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_deprecated_sku;
  EXCEPTION WHEN OTHERS THEN
    v_surviving_master_id := NULL;
    v_deprecated_master_id := NULL;
  END;

  -- 3. Iterate over every site having the deprecated SKU in this country
  FOR v_dep_rec IN
    SELECT p.*
    FROM products p
    JOIN sites s ON s.id = p.site_id
    WHERE s.country = p_country AND p.sku = p_deprecated_sku
  LOOP
    -- Check if this site already has a row for the surviving SKU
    SELECT * INTO v_surv_rec
    FROM products
    WHERE site_id = v_dep_rec.site_id AND sku = p_surviving_sku
    LIMIT 1;

    IF FOUND THEN
      -- CASE A: Site has BOTH rows -> Consolidate into the surviving row
      UPDATE po_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE sale_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE stock_movements SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE barcode_approvals SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE discrepancy_resolutions SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE products SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;

      -- Consolidate physical stock and merge barcode aliases
      UPDATE products
      SET
        stock = COALESCE(stock, 0) + COALESCE(v_dep_rec.stock, 0),
        barcodes = (
          SELECT array_agg(DISTINCT b)
          FROM unnest(
            COALESCE(v_surv_rec.barcodes, ARRAY[]::text[]) ||
            COALESCE(v_dep_rec.barcodes, ARRAY[]::text[]) ||
            CASE WHEN v_dep_rec.barcode IS NOT NULL AND v_dep_rec.barcode <> '' THEN ARRAY[v_dep_rec.barcode] ELSE ARRAY[]::text[] END
          ) AS b
          WHERE b IS NOT NULL AND b <> ''
        ),
        barcode = COALESCE(barcode, v_dep_rec.barcode),
        updated_at = now()
      WHERE id = v_surv_rec.id;

      v_merged_stock := v_merged_stock + COALESCE(v_dep_rec.stock, 0);

      -- Safely delete the deprecated product row
      DELETE FROM products WHERE id = v_dep_rec.id;

    ELSE
      -- CASE B: Site only has the deprecated row -> Simply rename to surviving SKU
      UPDATE products
      SET
        sku = p_surviving_sku,
        updated_at = now()
      WHERE id = v_dep_rec.id;
    END IF;

    v_sites_affected := v_sites_affected + 1;
  END LOOP;

  -- 4. Update po_items that still reference the old SKU by text
  UPDATE po_items
  SET sku = p_surviving_sku
  WHERE sku = p_deprecated_sku;

  -- 5. Mark deprecated master as MERGED in product_master if table exists
  IF v_deprecated_master_id IS NOT NULL AND v_surviving_master_id IS NOT NULL THEN
    UPDATE product_master
    SET
      status = 'MERGED',
      merged_into_id = v_surviving_master_id,
      updated_at = now()
    WHERE id = v_deprecated_master_id;
  END IF;

  RETURN jsonb_build_object(
    'country', p_country,
    'surviving_sku', p_surviving_sku,
    'deprecated_sku', p_deprecated_sku,
    'sites_affected', v_sites_affected,
    'consolidated_stock', v_merged_stock,
    'status', 'success'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.merge_duplicate_product_sku(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_product_sku(text, text, text) TO authenticated;
