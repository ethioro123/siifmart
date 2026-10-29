-- Assign a unique country/site-scoped receipt number on every saved POS sale.
-- Format: COUNTRY-SITE_NUMBER + six-digit sequence, for example ET-3000001.
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS offline_receipt_number text;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.pos_receipt_sequences (
    country_code text NOT NULL,
    site_id uuid NOT NULL REFERENCES public.sites(id),
    last_number bigint NOT NULL CHECK (last_number > 0),
    PRIMARY KEY (country_code, site_id)
);

REVOKE ALL ON TABLE private.pos_receipt_sequences FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.assign_pos_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
    site_row public.sites%ROWTYPE;
    country text;
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

    IF COALESCE(NEW.receipt_number, '') LIKE 'OFF-%' THEN
        NEW.offline_receipt_number := COALESCE(NEW.offline_receipt_number, NEW.receipt_number);
    END IF;

    SELECT COALESCE(MAX((regexp_match(
        s.receipt_number,
        '^' || country || '-' || site_row.site_number::text || '([0-9]{6,})$'
    ))[1]::bigint), 0)
    INTO highest_existing_number
    FROM public.sales s
    WHERE s.site_id = site_row.id
      AND s.country_code = country;

    INSERT INTO private.pos_receipt_sequences (country_code, site_id, last_number)
    VALUES (country, site_row.id, highest_existing_number + 1)
    ON CONFLICT (country_code, site_id)
    DO UPDATE SET last_number = GREATEST(
        private.pos_receipt_sequences.last_number + 1,
        EXCLUDED.last_number
    )
    RETURNING last_number INTO next_number;

    NEW.receipt_number := country || '-' || site_row.site_number::text || lpad(next_number::text, 6, '0');
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.assign_pos_receipt_number() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS assign_pos_receipt_number ON public.sales;
CREATE TRIGGER assign_pos_receipt_number
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION private.assign_pos_receipt_number();

CREATE UNIQUE INDEX IF NOT EXISTS sales_country_site_receipt_number_unique
    ON public.sales (receipt_number)
    WHERE receipt_number ~ '^[A-Z]{2,3}-[0-9]{7,}$';

CREATE INDEX IF NOT EXISTS sales_offline_receipt_number_idx
    ON public.sales (offline_receipt_number)
    WHERE offline_receipt_number IS NOT NULL;

