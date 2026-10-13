-- ============================================================================
-- Migration: 20261013_product_master_foundation.sql
-- Phase 2: One product master per country (additive, NO rows merged or deleted).
--   * product_master: country-level identity (SKU, barcode, name, status)
--   * products.master_id: existing per-site stock rows point at their master
--   * sku_counters + next_sku(): atomic, race-free SKU issuing
--   * find_product_by_barcode(): duplicate check before proposing a product
--   * product_merge_candidates: review view for HQ (nothing auto-merged)
-- ============================================================================

-- 1. Master table
CREATE TABLE IF NOT EXISTS product_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  sku text NOT NULL,
  name text NOT NULL,
  category text,
  barcode text,
  brand text,
  unit text,
  size text,
  pack_quantity numeric,
  cost_price numeric,
  price_band_min numeric,
  price_band_max numeric,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'MERGED')),
  origin_region_code text REFERENCES regions(code) ON UPDATE CASCADE,
  origin_site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  merged_into_id uuid REFERENCES product_master(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_master_country_sku_unique UNIQUE (country_code, sku),
  CONSTRAINT product_master_price_band_check
    CHECK (price_band_min IS NULL OR price_band_max IS NULL OR price_band_min <= price_band_max),
  CONSTRAINT product_master_merge_check
    CHECK ((status = 'MERGED') = (merged_into_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS product_master_country_barcode_unique
  ON product_master (country_code, barcode)
  WHERE barcode IS NOT NULL AND barcode <> '' AND status <> 'MERGED';
CREATE INDEX IF NOT EXISTS idx_product_master_country_status ON product_master (country_code, status);
CREATE INDEX IF NOT EXISTS idx_product_master_origin_region ON product_master (origin_region_code);
CREATE INDEX IF NOT EXISTS idx_product_master_merged_into ON product_master (merged_into_id);

-- 2. Link existing site rows
ALTER TABLE products ADD COLUMN IF NOT EXISTS master_id uuid REFERENCES product_master(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_products_master_id ON products (master_id);

-- 3. Backfill: one master per (country, sku). Test/E2E rows are skipped on purpose.
WITH src AS (
  SELECT s.country AS country_code, p.sku, p.name, p.category, NULLIF(trim(p.barcode), '') AS barcode,
         p.brand, p.unit, p.size, p.pack_quantity, p.cost_price, p.created_at,
         s.region_code, s.id AS site_id,
         row_number() OVER (PARTITION BY s.country, p.sku ORDER BY p.created_at) AS rn_sku
  FROM products p
  JOIN sites s ON s.id = p.site_id
  WHERE p.sku IS NOT NULL
    AND p.sku !~* '^(TESTSKU|VERIFYSKU|E2E)'
    AND coalesce(p.category, '') <> 'Test'
), firsts AS (
  SELECT *, row_number() OVER (PARTITION BY country_code, barcode ORDER BY created_at) AS rn_bar
  FROM src WHERE rn_sku = 1
)
INSERT INTO product_master (country_code, sku, name, category, barcode, brand, unit, size,
                            pack_quantity, cost_price, status, origin_region_code, origin_site_id,
                            approved_by, approved_at)
SELECT country_code, sku, name, category,
       CASE WHEN barcode IS NOT NULL AND rn_bar = 1 THEN barcode ELSE NULL END,
       brand, unit, size, pack_quantity, cost_price, 'APPROVED', region_code, site_id,
       'SYSTEM_BACKFILL', now()
FROM firsts
ON CONFLICT (country_code, sku) DO NOTHING;

UPDATE products p
SET master_id = m.id
FROM sites s, product_master m
WHERE s.id = p.site_id AND m.country_code = s.country AND m.sku = p.sku AND p.master_id IS NULL;

-- 4. Atomic SKU counters
CREATE TABLE IF NOT EXISTS sku_counters (
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  category_prefix text NOT NULL CHECK (category_prefix ~ '^[A-Z]{2,4}$'),
  last_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (country_code, category_prefix)
);
ALTER TABLE sku_counters ENABLE ROW LEVEL SECURITY;  -- no policies: only next_sku() (SECURITY DEFINER) touches it

-- Seed from existing sovereign-format SKUs, e.g. KEGR001 -> (KE, GR, 1)
INSERT INTO sku_counters (country_code, category_prefix, last_value)
SELECT m[1], m[2], max(m[3]::int)
FROM (
  SELECT regexp_match(upper(replace(replace(sku, '-', ''), ' ', '')), '^(ET|KE|UG|RW|TZ|SO|SS|DJ)([A-Z]{2,4})([0-9]{1,5})$') AS m
  FROM products
) x
WHERE m IS NOT NULL
GROUP BY m[1], m[2]
ON CONFLICT (country_code, category_prefix)
DO UPDATE SET last_value = GREATEST(sku_counters.last_value, EXCLUDED.last_value);

CREATE OR REPLACE FUNCTION public.next_sku(p_country text, p_category_prefix text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_next integer;
BEGIN
  IF p_country !~ '^[A-Z]{2}$' OR p_category_prefix !~ '^[A-Z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid country or category prefix';
  END IF;
  IF p_country <> public.get_my_country_code() AND NOT public.is_ceo() THEN
    RAISE EXCEPTION 'Cannot issue SKUs for another country';
  END IF;

  INSERT INTO sku_counters (country_code, category_prefix, last_value)
  VALUES (p_country, p_category_prefix, 1)
  ON CONFLICT (country_code, category_prefix)
  DO UPDATE SET last_value = sku_counters.last_value + 1
  RETURNING last_value INTO v_next;

  RETURN p_country || p_category_prefix || lpad(v_next::text, 3, '0');
END $$;

REVOKE ALL ON FUNCTION public.next_sku(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_sku(text, text) TO authenticated;

-- 5. Barcode duplicate check (runs with caller's RLS)
CREATE OR REPLACE FUNCTION public.find_product_by_barcode(p_country text, p_barcode text)
RETURNS SETOF product_master
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT * FROM product_master
  WHERE country_code = p_country AND barcode = p_barcode AND status <> 'MERGED'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.find_product_by_barcode(text, text) TO authenticated;

-- 6. RLS
ALTER TABLE product_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_master_select ON product_master;
CREATE POLICY product_master_select ON product_master FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    country_code = (SELECT public.get_my_country_code())
    AND (
      status = 'APPROVED'
      OR public.is_admin()
      OR created_by = (SELECT auth.uid())::text
    )
  )
);

-- Anyone in the country may PROPOSE a product (always PENDING); HQ roles may create approved ones
DROP POLICY IF EXISTS product_master_insert ON product_master;
CREATE POLICY product_master_insert ON product_master FOR INSERT TO authenticated
WITH CHECK (
  country_code = (SELECT public.get_my_country_code())
  AND (status = 'PENDING' OR (SELECT public.get_my_role()) IN
        ('super_admin', 'operations_manager', 'procurement_manager', 'supply_chain_manager'))
);

-- Only HQ-level roles approve, reject, merge or edit master data
DROP POLICY IF EXISTS product_master_update ON product_master;
CREATE POLICY product_master_update ON product_master FOR UPDATE TO authenticated
USING ((SELECT public.get_my_role()) IN
       ('super_admin', 'operations_manager', 'procurement_manager', 'supply_chain_manager')
       AND (public.is_ceo() OR country_code = (SELECT public.get_my_country_code())))
WITH CHECK ((SELECT public.get_my_role()) IN
       ('super_admin', 'operations_manager', 'procurement_manager', 'supply_chain_manager'));

-- No DELETE policy: master records are retired via status, never deleted.

-- 7. Review view: same country + same normalised name but different SKUs (nothing is merged automatically)
CREATE OR REPLACE VIEW product_merge_candidates WITH (security_invoker = true) AS
SELECT country_code,
       lower(trim(name)) AS normalized_name,
       count(*) AS master_count,
       array_agg(sku ORDER BY sku) AS skus,
       array_agg(id ORDER BY sku) AS master_ids
FROM product_master
WHERE status <> 'MERGED'
GROUP BY country_code, lower(trim(name))
HAVING count(*) > 1;
