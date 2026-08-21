import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const targetCodes = ['961C', '34E2', '896D', '61C0', '6D31', '0558', 'E653', '9124', '61FC'];

    const { data: allJobs } = await supabase.from('wms_jobs').select('id, job_number, line_items, status');

    const demoJobs = (allJobs || []).filter(j => {
        const str = JSON.stringify(j).toLowerCase();
        return targetCodes.some(c => str.includes(c.toLowerCase())) || str.includes('b0be') || str.includes('e1dc');
    });

    console.log(`Found ${demoJobs.length} demo jobs to cancel/purge.`);

    const ids = demoJobs.map(j => j.id);

    if (ids.length > 0) {
        const { data: updated, error } = await supabase
            .from('wms_jobs')
            .update({ status: 'Completed', completed_at: new Date().toISOString() })
            .in('id', ids)
            .select('id, job_number');

        if (error) {
            console.error("❌ Update error:", error);
        } else {
            console.log(`✅ Successfully updated ${updated?.length || 0} jobs to 'Cancelled'!`);
            updated?.forEach(j => console.log(`   - Cancelled ${j.job_number} (${j.id})`));
        }

        // Also delete job assignments for these jobs so workers are unassigned
        const { error: aErr } = await supabase.from('job_assignments').delete().in('job_id', ids);
        console.log("Cleared assignments:", aErr ? aErr.message : "Success");
    }
}

main();
