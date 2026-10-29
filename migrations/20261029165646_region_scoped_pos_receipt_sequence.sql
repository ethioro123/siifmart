-- Use the assigned three-letter region code for official POS receipt numbers.
-- Format: REGION-SITE_NUMBER + six-digit site sequence, for example ADD-2000001.
CREATE OR REPLACE FUNCTION private.assign_pos_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
    site_row public.sites%ROWTYPE;
    country text;
    region text;
    highest_existing_number bigint;
    next_number bigint;
BEGIN
    IF NEW.site_id IS NULL THEN
        RAISE EXCEPTION 'A site is required to number a POS receipt';
    END IF;

    SELECT * INTO site_row
    FROM public.sites
    WHERE id = NEW.site_id
    FOR SHARE;

    IF NOT FOUND OR site_row.site_number IS NULL THEN
        RAISE EXCEPTION 'The sale site has no receipt site number';
    END IF;

    country := upper(COALESCE(NULLIF(site_row.country, ''), NEW.country_code, 'ET'));
    NEW.country_code := country;

    SELECT upper(reg.code) INTO region
    FROM public.regions AS reg
    WHERE upper(reg.code) = upper(COALESCE(site_row.region_code, ''))
      AND upper(reg.country) = country
      AND reg.code ~ '^[A-Za-z]{3}$'
    FOR SHARE;

    IF region IS NULL THEN
        RAISE EXCEPTION 'The sale site must be assigned to a valid three-letter region code';
    END IF;

    IF COALESCE(NEW.receipt_number, '') LIKE 'OFF-%' THEN
        NEW.offline_receipt_number := COALESCE(NEW.offline_receipt_number, NEW.receipt_number);
    END IF;

    SELECT COALESCE(MAX((regexp_match(
        s.receipt_number,
        '^' || region || '-' || site_row.site_number::text || '([0-9]{6,})$'
    ))[1]::bigint), 0)
    INTO highest_existing_number
    FROM public.sales AS s
    WHERE s.site_id = site_row.id
      AND upper(s.country_code) = country;

    INSERT INTO private.pos_receipt_sequences (country_code, site_id, last_number)
    VALUES (country, site_row.id, highest_existing_number + 1)
    ON CONFLICT (country_code, site_id)
    DO UPDATE SET last_number = GREATEST(
        private.pos_receipt_sequences.last_number + 1,
        EXCLUDED.last_number
    )
    RETURNING last_number INTO next_number;

    NEW.receipt_number := region || '-' || site_row.site_number::text || lpad(next_number::text, 6, '0');
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.assign_pos_receipt_number() FROM PUBLIC, anon, authenticated;

-- The existing unique index already covers two- and three-letter prefixes.
