import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function runMigration() {
    console.log('🚀 Creating site_replenishment_sources table...');
    
    // Test connection first
    const { error: testError } = await supabase.from('sites').select('id').limit(1);
    if (testError) {
        console.error('❌ Cannot connect:', testError.message);
        return;
    }
    console.log('✅ Connected to Supabase.');

    // Try creating via RPC (requires exec_sql function) or just notify
    // The table creation requires DDL — we'll produce the SQL for the user to run in the Dashboard.
    console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new\n');

    const sql = `
-- Create site_replenishment_sources join table
CREATE TABLE IF NOT EXISTS public.site_replenishment_sources (
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    source_site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    PRIMARY KEY (site_id, source_site_id)
);

-- Backfill from existing sites.replenishment_source_id
INSERT INTO public.site_replenishment_sources (site_id, source_site_id)
SELECT id, replenishment_source_id
FROM public.sites
WHERE replenishment_source_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable Row-Level Security
ALTER TABLE public.site_replenishment_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS replenishment_sources_read ON public.site_replenishment_sources;
DROP POLICY IF EXISTS replenishment_sources_write ON public.site_replenishment_sources;
DROP POLICY IF EXISTS replenishment_sources_delete ON public.site_replenishment_sources;

-- Define clean policies
CREATE POLICY "replenishment_sources_read" ON public.site_replenishment_sources
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "replenishment_sources_write" ON public.site_replenishment_sources
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "replenishment_sources_delete" ON public.site_replenishment_sources
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- Grant access
REVOKE ALL ON public.site_replenishment_sources FROM anon;
GRANT ALL ON public.site_replenishment_sources TO authenticated;
    `.trim();

    console.log(sql);
    console.log('\n✅ Copy the SQL above and run it in your Supabase SQL Editor.');
}

runMigration();
