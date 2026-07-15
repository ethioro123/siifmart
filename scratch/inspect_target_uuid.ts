import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const jobNumber = 'HD9AQC';

    // Query wms_jobs table for this job number
    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('job_number', jobNumber);

    console.log('Query result:', jobs, error);
    if (jobs) {
        jobs.forEach(j => {
            console.log(`Job ${j.job_number} (${j.id}): type=${j.type}, status=${j.status}, transferStatus=${j.transfer_status}, items=${j.items_count}`);
            console.log('Line Items:', JSON.stringify(j.line_items, null, 2));
        });
    }
    
    // Also query transfers table in case it is a transfer record
    const { data: transfers, error: tErr } = await supabase
        .from('transfers')
        .select('*')
        .eq('job_number', jobNumber);
    console.log('Transfers query result:', transfers, tErr);
    if (transfers) {
        transfers.forEach(t => {
            console.log(`Transfer ${t.job_number} (${t.id}): status=${t.status}, transferStatus=${t.transfer_status}`);
        });
    }
}
main();
