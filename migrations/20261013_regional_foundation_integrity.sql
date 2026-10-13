-- ============================================================================
-- Migration: 20261013_regional_foundation_integrity.sql
-- Phase 1: Region <-> Site integrity. Additive and safe for current data
-- (verified: every site already has a region_code matching its country).
-- ============================================================================

-- 1. Every site must belong to a region; a region cannot be deleted while it has sites
ALTER TABLE sites ALTER COLUMN region_code SET NOT NULL;
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_region_code_fkey;
ALTER TABLE sites
  ADD CONSTRAINT sites_region_code_fkey
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 2. A site's country must equal its region's country
CREATE OR REPLACE FUNCTION enforce_site_region_country() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r_country text;
BEGIN
  SELECT country INTO r_country FROM regions WHERE code = NEW.region_code;
  IF r_country IS NULL THEN
    RAISE EXCEPTION 'Region % does not exist', NEW.region_code;
  END IF;
  IF NEW.country IS DISTINCT FROM r_country THEN
    RAISE EXCEPTION 'Site country (%) must match region country (%)', NEW.country, r_country;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_site_region_country ON sites;
CREATE TRIGGER trg_site_region_country
  BEFORE INSERT OR UPDATE OF region_code, country ON sites
  FOR EACH ROW EXECUTE FUNCTION enforce_site_region_country();

-- 3. A region's admin hub must be an Administration site inside that same region
CREATE OR REPLACE FUNCTION enforce_region_admin_hub() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s_type text; s_region text;
BEGIN
  IF NEW.admin_hub_site_id IS NULL THEN RETURN NEW; END IF;
  SELECT type, region_code INTO s_type, s_region FROM sites WHERE id = NEW.admin_hub_site_id;
  IF s_type NOT IN ('Administration', 'Administrative') THEN
    RAISE EXCEPTION 'Admin hub must be an Administration site';
  END IF;
  IF s_region IS DISTINCT FROM NEW.code THEN
    RAISE EXCEPTION 'Admin hub site must belong to region %', NEW.code;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_region_admin_hub ON regions;
CREATE TRIGGER trg_region_admin_hub
  BEFORE INSERT OR UPDATE OF admin_hub_site_id ON regions
  FOR EACH ROW EXECUTE FUNCTION enforce_region_admin_hub();

-- 4. Readiness view (seat checks are added in Phase 4)
CREATE OR REPLACE VIEW region_readiness WITH (security_invoker = true) AS
SELECT r.code AS region_code,
       r.country,
       r.status,
       (r.admin_hub_site_id IS NOT NULL) AS has_hub,
       (r.regional_manager_id IS NOT NULL) AS has_manager,
       (SELECT count(*) FROM sites s WHERE s.region_code = r.code) AS site_count
FROM regions r;
