-- Allocate purchase order numbers centrally while preserving AAAA0000 format.
-- The sequence is global because purchase_orders.po_number is globally unique.
BEGIN;

LOCK TABLE public.purchase_orders IN SHARE ROW EXCLUSIVE MODE;

DO $migration$
DECLARE
  next_from_orders bigint;
  sequence_last bigint;
  sequence_called boolean;
  next_from_sequence bigint;
BEGIN
  SELECT COALESCE(MAX(
    (((ASCII(SUBSTRING(UPPER(po_number) FROM 1 FOR 1)) - 65)::bigint * 17576
     + (ASCII(SUBSTRING(UPPER(po_number) FROM 2 FOR 1)) - 65) * 676
     + (ASCII(SUBSTRING(UPPER(po_number) FROM 3 FOR 1)) - 65) * 26
     + (ASCII(SUBSTRING(UPPER(po_number) FROM 4 FOR 1)) - 65)) * 10000
     + SUBSTRING(po_number FROM 5 FOR 4)::bigint
  ), -1) + 2
  INTO next_from_orders
  FROM public.purchase_orders
  WHERE UPPER(po_number) ~ '^[A-Z]{4}[0-9]{4}$';

  SELECT last_value, is_called
  INTO sequence_last, sequence_called
  FROM public.po_number_seq;

  next_from_sequence := sequence_last + CASE WHEN sequence_called THEN 1 ELSE 0 END;
  PERFORM setval(
    'public.po_number_seq'::regclass,
    GREATEST(next_from_orders, next_from_sequence, 1),
    false
  );
END;
$migration$;

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  number_index bigint;
  letter_index bigint;
BEGIN
  number_index := nextval('public.po_number_seq'::regclass) - 1;
  letter_index := number_index / 10000;

  IF letter_index >= 456976 THEN
    RAISE EXCEPTION 'Purchase order number space exhausted' USING ERRCODE = '22003';
  END IF;

  NEW.po_number :=
    CHR(65 + ((letter_index / 17576) % 26)::integer)
    || CHR(65 + ((letter_index / 676) % 26)::integer)
    || CHR(65 + ((letter_index / 26) % 26)::integer)
    || CHR(65 + (letter_index % 26)::integer)
    || LPAD((number_index % 10000)::text, 4, '0');

  RETURN NEW;
END;
$function$;

COMMIT;
