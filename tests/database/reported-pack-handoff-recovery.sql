-- Rollback-only reproduction for the completed Pack whose client dispatch insert failed.
BEGIN;
SELECT set_config('request.jwt.claim.sub',completed_by,true) FROM public.wms_jobs WHERE id='66d1e5eb-168c-46c6-8ef6-daa784f9a12a';
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',completed_by,'role','authenticated')::text,true) FROM public.wms_jobs WHERE id='66d1e5eb-168c-46c6-8ef6-daa784f9a12a';
SET LOCAL ROLE authenticated;
DO $$ DECLARE first_result jsonb; retry jsonb; BEGIN
 first_result:=public.complete_pack_job('66d1e5eb-168c-46c6-8ef6-daa784f9a12a');
 retry:=public.complete_pack_job('66d1e5eb-168c-46c6-8ef6-daa784f9a12a');
 IF first_result->'dispatch'->>'id' IS NULL OR first_result->'dispatch'->>'id' IS DISTINCT FROM retry->'dispatch'->>'id' THEN RAISE EXCEPTION 'TEST: recovery failed or duplicated dispatch'; END IF;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: reported completed Pack recovers exactly one dispatch under its verifier, with no lasting test changes' AS result;
