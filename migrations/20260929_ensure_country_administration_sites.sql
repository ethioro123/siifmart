-- Migration: Ensure dedicated Administration Central HQ for every country
-- Enforces: "Administration HQ is a must for every country, so whenever a country is created an administration HQ is automatically created"
-- Supports: ET (Ethiopia), KE (Kenya), UG (Uganda), RW (Rwanda), TZ (Tanzania) and dynamic sovereign nations.
-- Fixes: Dynamically assigns unique site_number to prevent duplicate key violations on sites_site_number_unique.

-- 1. Ensure required columns exist on sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'ET';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETB';

-- Backfill any unassigned sites to Ethiopia
UPDATE sites SET country = 'ET' WHERE country IS NULL;
UPDATE sites SET currency = 'ETB' WHERE currency IS NULL;

-- Index for country and type queries
CREATE INDEX IF NOT EXISTS idx_sites_country_type ON sites(country, type);

-- 2. Stored Procedure: Automatically provision an Administration HQ with guaranteed unique site_number & code
CREATE OR REPLACE FUNCTION auto_provision_country_admin_site(
    p_country text,
    p_name text DEFAULT NULL,
    p_currency text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_region text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_site_id uuid;
    v_code text;
    v_name text;
    v_currency text;
    v_address text;
    v_region text;
    v_country text;
    v_next_site_num integer;
BEGIN
    v_country := UPPER(TRIM(p_country));
    
    -- Check if an Administration site already exists for this country
    SELECT id INTO v_site_id
    FROM sites
    WHERE UPPER(country) = v_country
      AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
        RETURN v_site_id;
    END IF;

    -- Dynamically resolve next unique site_number to satisfy sites_site_number_unique constraint
    SELECT COALESCE(MAX(site_number), 0) + 1 INTO v_next_site_num FROM sites;

    -- Standardized defaults per country
    v_code := CASE WHEN v_country = 'ET' THEN 'SITE-0001' ELSE 'SITE-' || v_country || '-0001' END;
    
    -- Ensure code is unique in case of existing custom code
    IF EXISTS (SELECT 1 FROM sites WHERE code = v_code) THEN
        v_code := 'SITE-' || v_country || '-' || LPAD(v_next_site_num::text, 4, '0');
    END IF;

    v_name := COALESCE(p_name, CASE 
        WHEN v_country = 'ET' THEN 'Central Operations'
        WHEN v_country = 'KE' THEN 'Kenya Central Operations'
        WHEN v_country = 'UG' THEN 'Uganda Central Operations'
        WHEN v_country = 'RW' THEN 'Rwanda Central Operations'
        WHEN v_country = 'TZ' THEN 'Tanzania Central Operations'
        ELSE v_country || ' Central Operations'
    END);
    v_currency := COALESCE(p_currency, CASE 
        WHEN v_country = 'ET' THEN 'ETB'
        WHEN v_country = 'KE' THEN 'KSh'
        WHEN v_country = 'UG' THEN 'USh'
        WHEN v_country = 'RW' THEN 'RWF'
        WHEN v_country = 'TZ' THEN 'TSh'
        ELSE 'USD'
    END);
    v_region := COALESCE(p_region, 'Central');
    v_address := COALESCE(p_address, v_region || ' Central Business District');

    -- Insert new Administration HQ with guaranteed unique site_number
    INSERT INTO sites (
        name,
        code,
        type,
        address,
        region,
        status,
        manager,
        country,
        currency,
        site_number,
        is_fulfillment_node,
        created_at,
        updated_at
    ) VALUES (
        v_name,
        v_code,
        'Administration',
        v_address,
        v_region,
        'Active',
        'HQ Administration',
        v_country,
        v_currency,
        v_next_site_num,
        false,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_site_id;

    RETURN v_site_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure Ethiopia Administration HQ ('Central Operations' / SITE-0001)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM sites WHERE name = 'Central Operations' OR code = 'SITE-0001') THEN
        UPDATE sites
        SET type = 'Administration',
            country = 'ET',
            currency = 'ETB',
            code = 'SITE-0001',
            status = 'Active'
        WHERE name = 'Central Operations' OR code = 'SITE-0001';
    ELSE
        PERFORM auto_provision_country_admin_site('ET', 'Central Operations', 'ETB', 'Bole Sub-City, Addis Ababa', 'Addis Ababa');
    END IF;
END $$;

-- 4. Idempotently provision Administration HQs for all operating countries
SELECT auto_provision_country_admin_site('KE', 'Kenya Central Operations', 'KSh', 'Nairobi Central Business District, Kenyatta Avenue', 'Nairobi County');
SELECT auto_provision_country_admin_site('UG', 'Uganda Central Operations', 'USh', 'Kampala Central Business District, Kampala Road', 'Kampala');
SELECT auto_provision_country_admin_site('RW', 'Rwanda Central Operations', 'RWF', 'Kigali City Center, KN 3 Ave', 'Kigali');
SELECT auto_provision_country_admin_site('TZ', 'Tanzania Central Operations', 'TSh', 'Dar es Salaam City Centre, Samora Avenue', 'Dar es Salaam');

-- 5. Trigger: Automatically provision an Administration HQ when a new site is added with a new country
CREATE OR REPLACE FUNCTION trg_ensure_admin_site_on_new_country()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.country IS NOT NULL AND NEW.type != 'Administration' THEN
        IF NOT EXISTS (
            SELECT 1 FROM sites 
            WHERE UPPER(country) = UPPER(NEW.country) 
              AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
        ) THEN
            PERFORM auto_provision_country_admin_site(NEW.country);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sites_auto_provision_admin ON sites;
CREATE TRIGGER trg_sites_auto_provision_admin
AFTER INSERT ON sites
FOR EACH ROW
EXECUTE FUNCTION trg_ensure_admin_site_on_new_country();

-- 6. Zero-Trust Delete Protection: Prevent deleting the primary Administration HQ for any country
CREATE OR REPLACE FUNCTION protect_country_admin_site()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations') THEN
        IF (SELECT COUNT(*) FROM sites 
            WHERE UPPER(country) = UPPER(OLD.country) 
              AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
              AND id != OLD.id) = 0 THEN
            RAISE EXCEPTION 'Cannot delete the primary Administration HQ for country %. Every country must retain an Administration central site.', OLD.country;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_country_admin_site ON sites;
CREATE TRIGGER trg_protect_country_admin_site
BEFORE DELETE ON sites
FOR EACH ROW
EXECUTE FUNCTION protect_country_admin_site();
