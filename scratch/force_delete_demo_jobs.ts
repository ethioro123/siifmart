import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active for:", authData?.user?.email);

    // Fetch all jobs
    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('*');

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    const targetCodes = ['961C', '34E2', '896D', '61C0', '6D31', '0558', 'E653', '9124', '61FC'];

    const jobsToDelete = (jobs || []).filter(j => {
        const jNum = (j.job_number || '').toUpperCase();
        if (targetCodes.some(c => jNum.includes(c))) return true;

        const str = JSON.stringify(j).toLowerCase();
        if (str.includes('b0be') || str.includes('e1dc') || str.includes('pan-ric-001') || str.includes('snk-alm-001') || str.includes('pan-pas-001') || str.includes('frt-ban-001') || str.includes('snk-cho-001') || str.includes('dai-egg-001')) {
            return true;
        }
        return false;
    });

    console.log(`Found ${jobsToDelete.length} demo jobs to delete:`);
    jobsToDelete.forEach(j => {
        console.log(`- ID: ${j.id} | JobNumber: ${j.job_number} | Type: ${j.type} | Site: ${j.site_id}`);
    });

    if (jobsToDelete.length === 0) {
        console.log("No demo jobs to delete.");
        return;
    }

    const ids = jobsToDelete.map(j => j.id);

    // 1. Delete from job_assignments
    const { error: err1 } = await supabase.from('job_assignments').delete().in('job_id', ids);
    if (err1) console.error("Error deleting job_assignments:", err1);
    else console.log("✅ Cleared job_assignments");

    // 2. Delete from wms_job_items
    const { error: err2 } = await supabase.from('wms_job_items').delete().in('job_id', ids);
    if (err2) console.error("Error deleting wms_job_items:", err2);
    else console.log("✅ Cleared wms_job_items");

    // 3. Delete from wms_jobs ONE BY ONE to verify deletion result
    let deletedCount = 0;
    for (const id of ids) {
        const { error: err3 } = await supabase.from('wms_jobs').delete().eq('id', id);
        if (err3) {
            console.error(`❌ Failed to delete job ${id}:`, err3);
        } else {
            deletedCount++;
        }
    }

    console.log(`🎉 Finished! Successfully deleted ${deletedCount} of ${ids.length} jobs.`);
}

main();
