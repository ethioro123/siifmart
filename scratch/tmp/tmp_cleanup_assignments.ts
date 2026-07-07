import { createClient } from '@supabase/supabase-js';
const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function run() {
    console.log('Fetching stale job assignments...');
    
    // Auth as super admin
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    // Get all 'active' assignments
    const { data: assignments } = await c.from('job_assignments').select('*').in('status', ['Assigned', 'Accepted', 'In-Progress']);
    
    if (!assignments || assignments.length === 0) {
        console.log('No active assignments found.');
        return;
    }
    
    console.log(`Found ${assignments.length} active assignments to verify...`);
    let fixed = 0;
    
    for (const assignment of assignments) {
        // Fetch the corresponding job
        const { data: job } = await c.from('wms_jobs').select('status').eq('id', assignment.job_id).maybeSingle();
        
        if (job && ['Completed', 'Cancelled'].includes(job.status)) {
            console.log(`Job ${assignment.job_id} is ${job.status}, but assignment is ${assignment.status}. Fixing...`);
            
            // Fix it!
            await c.from('job_assignments').update({ status: job.status }).eq('id', assignment.id);
            fixed++;
        }
    }
    
    console.log(`\\n✅ Fixed ${fixed} stale assignments.`);
    process.exit(0);
}

run();
