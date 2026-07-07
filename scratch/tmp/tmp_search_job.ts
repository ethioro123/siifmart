import { createClient } from '@supabase/supabase-js';

const client = createClient(
    'https://zdgzpxvorwinugjufkvb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc'
);

async function main() {
    await client.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });

    // Let's do a broad search across wms_jobs text columns for 'NWZM'
    const { data: searchResults, error: searchErr } = await client.from('wms_jobs')
        .select('*')
        .or('job_number.ilike.%NWZM%,order_ref.ilike.%NWZM%,tracking_number.ilike.%NWZM%');
        
    console.log("Search for NWZM in wms_jobs:", searchResults);
    if(searchErr) console.error(searchErr);
    
    // Check if the job_assignments table has an FK to wms_jobs
    const { data: assignments } = await client.from('job_assignments')
        .select('id, job_id, employee_id, wms_jobs(job_number)')
        .limit(5);
    console.log("Assignments with wms_jobs join:", assignments);
    
    process.exit(0);
}

main().catch(console.error);
