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

    // Fetch all wms_jobs
    const { data: allJobs, error } = await supabase
        .from('wms_jobs')
        .select('id, job_number, type, status, line_items, site_id, created_at');

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    console.log(`Total jobs in DB: ${allJobs?.length || 0}`);

    const targetJobNumbers = ['961C', '34E2', '896D', '61C0', '6D31', '0558', 'E653', '9124', '61FC'];

    const demoJobsToDelete = allJobs?.filter(j => {
        const jNum = (j.job_number || '').toUpperCase();
        if (targetJobNumbers.some(t => jNum.includes(t))) return true;
        
        const lineItemsStr = JSON.stringify(j.line_items || []);
        if (lineItemsStr.includes('b0be') || lineItemsStr.includes('e1dc')) return true;

        return false;
    });

    console.log(`Found ${demoJobsToDelete?.length || 0} demo/leftover jobs to remove:`);
    demoJobsToDelete?.forEach(j => {
        console.log(`- ID: ${j.id} | JobNumber: ${j.job_number} | Type: ${j.type} | Status: ${j.status} | CreatedAt: ${j.created_at}`);
    });

    if (demoJobsToDelete && demoJobsToDelete.length > 0) {
        const idsToDelete = demoJobsToDelete.map(j => j.id);

        // Delete from job_assignments first if foreign key constraints exist
        const { error: assignErr } = await supabase
            .from('job_assignments')
            .delete()
            .in('job_id', idsToDelete);
        if (assignErr) console.error("Error deleting job_assignments:", assignErr);

        // Delete from wms_jobs
        const { error: deleteErr } = await supabase
            .from('wms_jobs')
            .delete()
            .in('id', idsToDelete);

        if (deleteErr) {
            console.error("Error deleting demo jobs:", deleteErr);
        } else {
            console.log(`Successfully deleted ${idsToDelete.length} demo jobs from database!`);
        }
    }
}

main();
