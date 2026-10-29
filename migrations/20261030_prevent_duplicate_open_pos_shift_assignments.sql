-- Prevent concurrent open shifts from sharing a site counter or cashier.
-- Existing duplicate open rows are intentionally preserved for audit review.
ALTER TABLE public.shifts
    ADD COLUMN IF NOT EXISTS terminal_id text;

UPDATE public.shifts AS shift
SET terminal_id = upper(site.code) || '-POS-' || lpad(substring(shift.counter_number FROM '[0-9]+$'), 2, '0')
FROM public.sites AS site
WHERE shift.site_id = site.id
  AND shift.terminal_id IS NULL
  AND COALESCE(NULLIF(btrim(shift.counter_number), ''), 'Counter 1') ~* '^Counter [1-9][0-9]*$';

CREATE INDEX IF NOT EXISTS idx_shifts_site_terminal_id
    ON public.shifts (site_id, terminal_id);

CREATE OR REPLACE FUNCTION public.enforce_open_shift_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
    normalized_counter text;
    site_code text;
BEGIN
    IF NEW.status IS DISTINCT FROM 'Open' THEN
        RETURN NEW;
    END IF;

    IF NEW.site_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIFT_SITE_REQUIRED';
    END IF;

    SELECT site.code INTO site_code
    FROM public.sites AS site
    WHERE site.id = NEW.site_id;

    IF site_code IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIFT_SITE_REQUIRED';
    END IF;

    normalized_counter := COALESCE(NULLIF(btrim(NEW.counter_number), ''), 'Counter 1');
    NEW.counter_number := normalized_counter;

    IF normalized_counter !~* '^Counter [1-9][0-9]*$' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIFT_COUNTER_INVALID';
    END IF;

    NEW.terminal_id := upper(site_code) || '-POS-' || lpad(substring(normalized_counter FROM '[0-9]+$'), 2, '0');

    -- Transaction-scoped advisory locks make the read/check/write atomic under concurrency.
    PERFORM pg_advisory_xact_lock(
        hashtextextended('shift-counter:' || NEW.site_id::text || ':' || lower(normalized_counter), 0)
    );

    IF EXISTS (
        SELECT 1
        FROM public.shifts existing
        WHERE existing.site_id = NEW.site_id
          AND existing.status = 'Open'
          AND existing.id IS DISTINCT FROM NEW.id
          AND lower(COALESCE(NULLIF(btrim(existing.counter_number), ''), 'Counter 1')) = lower(normalized_counter)
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIFT_COUNTER_OCCUPIED';
    END IF;

    IF NEW.cashier_id IS NOT NULL THEN
        PERFORM pg_advisory_xact_lock(
            hashtextextended('shift-cashier:' || NEW.site_id::text || ':' || NEW.cashier_id::text, 0)
        );

        IF EXISTS (
            SELECT 1
            FROM public.shifts existing
            WHERE existing.site_id = NEW.site_id
              AND existing.status = 'Open'
              AND existing.id IS DISTINCT FROM NEW.id
              AND existing.cashier_id = NEW.cashier_id
        ) THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SHIFT_CASHIER_ALREADY_OPEN';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_open_shift_assignment() FROM PUBLIC;

DROP TRIGGER IF EXISTS shifts_enforce_open_assignment ON public.shifts;
CREATE TRIGGER shifts_enforce_open_assignment
BEFORE INSERT OR UPDATE OF site_id, cashier_id, counter_number, status
ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_open_shift_assignment();
