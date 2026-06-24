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

    const jobId = 'dd9ad434-643d-4b79-b2d5-78d448218fc9';
    const { data: job, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching job:", error);
        return;
    }

    if (!job) {
        console.log(`Job with ID ${jobId} does NOT exist in the database!`);
        return;
    }

    console.log("Job details:", JSON.stringify(job, null, 2));

    // Try a test PATCH update
    console.log("Attempting test PATCH update on job...");
    const { data: updatedJob, error: updateError } = await supabase
        .from('wms_jobs')
        .update({ notes: (job.notes || '') + ' [Test update]' })
        .eq('id', jobId)
        .select();

    if (updateError) {
        console.error("PATCH Update failed with error:", updateError);
    } else {
        console.log("PATCH Update succeeded! Updated rows:", updatedJob);
    }
}
main();
