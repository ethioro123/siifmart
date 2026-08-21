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

    const siteId = '97452359-705d-44dd-b2de-1002d6c19a81'; // Adama Distribution Center

    const { data: siteJobs, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .or(`site_id.eq.${siteId},dest_site_id.eq.${siteId}`);

    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }

    console.log(`Found ${siteJobs?.length || 0} jobs for Adama Distribution Center:`);

    const targetSubstrings = ['961c', '34e2', '896d', '61c0', '6d31', '0558', 'e653', '9124', '61fc', 'b0be', 'e1dc'];

    const jobsToDelete = (siteJobs || []).filter(j => {
        const str = JSON.stringify(j).toLowerCase();
        return targetSubstrings.some(sub => str.includes(sub));
    });

    console.log(`Matching demo jobs to delete: ${jobsToDelete.length}`);
    jobsToDelete.forEach(j => {
        console.log(`- ID: ${j.id} | JobNo: ${j.job_number} | Type: ${j.type} | Status: ${j.status}`);
    });

    if (jobsToDelete.length === 0) return;

    const ids = jobsToDelete.map(j => j.id);

    // Delete job assignments first
    const { error: aErr } = await supabase.from('job_assignments').delete().in('job_id', ids);
    console.log("Deleted assignments error:", aErr);

    // Delete wms_job_items
    const { error: iErr } = await supabase.from('wms_job_items').delete().in('job_id', ids);
    console.log("Deleted job items error:", iErr);

    // Delete wms_jobs
    let count = 0;
    for (const id of ids) {
        const { error: dErr } = await supabase.from('wms_jobs').delete().eq('id', id);
        if (dErr) {
            console.error(`Failed to delete ${id}:`, dErr);
        } else {
            count++;
        }
    }

    console.log(`Successfully deleted ${count} of ${ids.length} demo jobs!`);
}

main();
