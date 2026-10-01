-- ==============================================================================
-- Migration: Human-Readable Country-Scoped Site ID Sequencing
-- Description:
--   Establishes country-scoped human-readable site codes (KE-01, KE-02, UG-01, TZ-01, RW-01, ET-01).
--   Under every Country ID, sites increment sequentially (01, 02, 03...).
--   CRITICAL: Internal primary key UUIDs ('id') remain 100% untouched to preserve
--   all foreign key relations (products, sales, orders, shifts, inventory).
-- ==============================================================================

-- 1. Ensure required columns and indexes exist on sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'ET';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETB';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_sites_country_code ON sites(country, code);

-- 2. Stored Procedure: Generate Next Country-Scoped Site Code (e.g. KE-01, KE-02, UG-01)
CREATE OR REPLACE FUNCTION generate_next_site_code(p_country text)
RETURNS text AS $$
DECLARE
    v_country text;
    v_max_seq integer := 0;
    v_curr_seq integer;
    r RECORD;
BEGIN
    v_country := UPPER(TRIM(p_country));
    IF v_country IS NULL OR v_country = '' THEN
        v_country := 'ET';
    END IF;

    -- Scan existing sites for this specific country
    FOR r IN (
        SELECT code 
        FROM sites 
        WHERE UPPER(COALESCE(country, 'ET')) = v_country
          AND code IS NOT NULL
    ) LOOP
        -- Match direct pattern: KE-01, ET-02
        IF r.code ~* ('^' || v_country || '-(\d+)$') THEN
            v_curr_seq := (regexp_match(r.code, '^' || v_country || '-(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        -- Match legacy pattern: SITE-KE-0001
        ELSIF r.code ~* ('^SITE-' || v_country || '-(\d+)$') THEN
            v_curr_seq := (regexp_match(r.code, '^SITE-' || v_country || '-(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        -- Match historic Ethiopian pattern: SITE-0001, ST-001, WH-001
        ELSIF v_country = 'ET' AND r.code ~* '^(?:SITE|ST|WH)-?(\d+)$' THEN
            v_curr_seq := (regexp_match(r.code, '^(?:SITE|ST|WH)-?(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        END IF;
    END LOOP;

    RETURN v_country || '-' || LPAD((v_max_seq + 1)::text, 2, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Update auto_provision_country_admin_site to use the human-readable [COUNTRY]-01 format
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
    IF v_country IS NULL OR v_country = '' THEN
        v_country := 'ET';
    END IF;
    
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

    -- Human-readable country-scoped site code: KE-01, UG-01, TZ-01, RW-01, ET-01
    v_code := v_country || '-01';
    
    -- Ensure code is unique in case of collision
    IF EXISTS (SELECT 1 FROM sites WHERE code = v_code) THEN
        v_code := generate_next_site_code(v_country);
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

    -- Insert new Administration HQ with guaranteed unique site_number and human-readable code
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

-- 4. Safe Backfill: Standardize legacy codes to human-readable country-scoped format
-- Safe operation: updates 'code' ONLY, leaving 'id' (UUID) and all FK references 100% intact.
DO $$
DECLARE
    rec RECORD;
    v_country text;
    v_seq integer;
BEGIN
    FOR v_country IN SELECT DISTINCT UPPER(COALESCE(country, 'ET')) FROM sites LOOP
        v_seq := 1;
        FOR rec IN 
            SELECT id, code 
            FROM sites 
            WHERE UPPER(COALESCE(country, 'ET')) = v_country 
            ORDER BY 
                CASE WHEN type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations') THEN 0 ELSE 1 END,
                created_at ASC 
        LOOP
            -- Only update if not already formatted as [COUNTRY]-[0-9]+
            IF rec.code IS NULL OR NOT (rec.code ~* ('^' || v_country || '-\d+$')) THEN
                UPDATE sites 
                SET code = v_country || '-' || LPAD(v_seq::text, 2, '0')
                WHERE id = rec.id;
            END IF;
            v_seq := v_seq + 1;
        END LOOP;
    END LOOP;
END $$;
