import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySql() {
  const sql = `
DO $$
DECLARE
    found_constraint text;
BEGIN
    SELECT tc.constraint_name INTO found_constraint
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
    WHERE tc.constraint_type = 'UNIQUE' 
      AND tc.table_name = 'wms_jobs'
      AND ccu.column_name = 'job_number';

    IF found_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.wms_jobs DROP CONSTRAINT ' || quote_ident(found_constraint);
    END IF;
    
    -- Also drop any unique indexes just in case
    DROP INDEX IF EXISTS wms_jobs_job_number_key;
END $$;
  `;
  
  // We can't run arbitrary SQL via supabase-js without an RPC function.
  console.log("Cannot run raw SQL. User must use Supabase Dashboard.");
}
applySql();
