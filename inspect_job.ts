import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectJob() {
    console.log('🔑 Authenticating as CEO...');
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log('🔍 Querying WMS Job by job number: S0PA1J...');
    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .ilike('job_number', '%S0PA1J%');

    if (error) {
        console.error('❌ Error fetching jobs:', error);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('Job not found.');
        return;
    }

    const job = jobs[0];
    console.log('\n--- Job Details ---');
    console.log(`ID: ${job.id}`);
    console.log(`Job Number: ${job.job_number}`);
    console.log(`Type: ${job.type}`);
    console.log(`Status: ${job.status}`);
    console.log(`Transfer Status: ${job.transfer_status}`);
    console.log(`Source Site: ${job.source_site_id}`);
    console.log(`Dest Site: ${job.dest_site_id}`);
    console.log(`Line Items:`, JSON.stringify(job.line_items, null, 2));
}

inspectJob();
