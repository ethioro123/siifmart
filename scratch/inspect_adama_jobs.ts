import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active:", !!authRes.data.session);

    // Get site id for Adama Distribution Center
    const { data: sites } = await supabase.from('sites').select('id, name').ilike('name', '%Adama%');
    console.log("Sites found:", sites);

    // Fetch ALL jobs in wms_jobs
    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('*');

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    console.log(`Total jobs in DB: ${jobs?.length || 0}`);
    
    // Print all job numbers and types and sites
    jobs?.forEach(j => {
        console.log(`- ID: ${j.id} | JobNo: ${j.job_number} | Type: ${j.type} | Site: ${j.site_id} | Status: ${j.status}`);
    });
}

main();
