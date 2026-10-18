-- Reserve country-scoped worker IDs atomically instead of deriving them from
-- the RLS-filtered employee rows visible to the current client.

CREATE TABLE IF NOT EXISTS public.employee_id_sequences (
    country_code text PRIMARY KEY CHECK (country_code ~ '^[A-Z]{2}$'),
    last_sequence bigint NOT NULL CHECK (last_sequence >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_id_sequences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.employee_id_sequences FROM PUBLIC, anon, authenticated;

WITH parsed_codes AS (
    SELECT
        (regexp_match(upper(code), '^([A-Z]{2})-SIIF([0-9]+)$'))[1] AS country_code,
        (regexp_match(upper(code), '^([A-Z]{2})-SIIF([0-9]+)$'))[2]::bigint AS sequence_number
    FROM public.employees
    WHERE code IS NOT NULL
      AND upper(code) ~ '^[A-Z]{2}-SIIF[0-9]+$'
), initial_sequences AS (
    SELECT
        country_code,
        greatest(max(sequence_number), CASE WHEN country_code = 'ET' THEN 39 ELSE 0 END) AS last_sequence
    FROM parsed_codes
    GROUP BY country_code
)
INSERT INTO public.employee_id_sequences (country_code, last_sequence)
SELECT country_code, last_sequence
FROM initial_sequences
ON CONFLICT (country_code) DO UPDATE
SET last_sequence = greatest(employee_id_sequences.last_sequence, EXCLUDED.last_sequence),
    updated_at = now();

INSERT INTO public.employee_id_sequences (country_code, last_sequence)
VALUES ('ET', 39)
ON CONFLICT (country_code) DO UPDATE
SET last_sequence = greatest(employee_id_sequences.last_sequence, EXCLUDED.last_sequence),
    updated_at = now();

CREATE OR REPLACE FUNCTION public.reserve_next_employee_code(p_country_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_country_code text := upper(btrim(p_country_code));
    v_role text;
    v_next_sequence bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authenticated employee context is required'
            USING ERRCODE = '42501';
    END IF;

    IF v_country_code IS NULL OR v_country_code !~ '^[A-Z]{2}$' THEN
        RAISE EXCEPTION 'A valid two-letter country code is required'
            USING ERRCODE = '22023';
    END IF;

    v_role := public.get_my_role();
    IF NOT (
        public.is_ceo()
        OR v_role = ANY (ARRAY[
            'super_admin', 'admin', 'CEO', 'hr_manager', 'hr',
            'regional_manager', 'regional_hr_officer'
        ])
        OR public.is_manager()
    ) THEN
        RAISE EXCEPTION 'You are not authorized to reserve employee IDs'
            USING ERRCODE = '42501';
    END IF;

    IF NOT public.is_ceo()
       AND v_country_code IS DISTINCT FROM upper(public.get_my_country_code()) THEN
        RAISE EXCEPTION 'Employee IDs may only be reserved within your authorized country'
            USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.employee_id_sequences (country_code, last_sequence)
    VALUES (v_country_code, CASE WHEN v_country_code = 'ET' THEN 39 ELSE 0 END)
    ON CONFLICT (country_code) DO NOTHING;

    UPDATE public.employee_id_sequences
    SET last_sequence = last_sequence + 1,
        updated_at = now()
    WHERE country_code = v_country_code
    RETURNING last_sequence INTO v_next_sequence;

    RETURN v_country_code || '-SIIF' || lpad(v_next_sequence::text, 4, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_next_employee_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_next_employee_code(text) TO authenticated;

COMMENT ON TABLE public.employee_id_sequences IS
    'Atomic, country-scoped employee ID counters. Direct client access is disabled; allocate through reserve_next_employee_code.';
COMMENT ON FUNCTION public.reserve_next_employee_code(text) IS
    'Atomically reserves the next country-scoped employee ID for an authorized hiring user.';
