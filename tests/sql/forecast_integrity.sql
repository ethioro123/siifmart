-- Staging-only regression checks. All request writes are rolled back.
BEGIN;
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000201","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE snapshot jsonb; first_request jsonb; second_request jsonb;
BEGIN
 snapshot := public.merchandising_forecast_snapshot('a1111111-1111-4000-8000-000000000001','ET');
 IF snapshot->>'asOf' IS NULL OR jsonb_typeof(snapshot->'demand')<>'array' THEN RAISE EXCEPTION 'Incomplete snapshot'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot->'products') p WHERE p->>'cost_price' IS NOT NULL)
 THEN RAISE EXCEPTION 'Specialist cost masking failed'; END IF;
 BEGIN
  PERFORM public.merchandising_forecast_snapshot('a1111111-1111-4000-8000-000000000001','KE');
  RAISE EXCEPTION 'Cross-country read allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 first_request := public.request_forecast_replenishment('6d971368-ee73-4fc8-bdcc-7e36a739103f',2);
 second_request := public.request_forecast_replenishment('6d971368-ee73-4fc8-bdcc-7e36a739103f',2);
 IF first_request->>'id' IS DISTINCT FROM second_request->>'id' OR NOT (second_request->>'existing')::boolean
 THEN RAISE EXCEPTION 'Duplicate request created'; END IF;
 BEGIN
  PERFORM public.request_forecast_replenishment('6d971368-ee73-4fc8-bdcc-7e36a739103f',0);
  RAISE EXCEPTION 'Invalid quantity accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.merchandising_forecast_snapshot('a1111111-1111-4000-8000-000000000001','ET');
  RAISE EXCEPTION 'Unauthenticated forecast allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
