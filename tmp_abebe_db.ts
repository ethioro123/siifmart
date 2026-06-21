import { createClient } from '@supabase/supabase-js';

const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function checkAbebeState() {
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    // Abebe's ID
    const abeId = '4d527609-63ca-430d-a777-557eb6405a35';
    
    // Get ALL active assignments for Abebe
    const { data: assignments } = await c.from('job_assignments')
        .select('job_id, status')
        .eq('employee_id', abeId);
        
    console.log(`=== Abebe has ${assignments?.length} assignments ===`);
    
    // Map them to wms_jobs
    if (assignments && assignments.length > 0) {
        for (const a of assignments) {
            const { data: job } = await c.from('wms_jobs').select('job_number, type, status, assigned_to').eq('id', a.job_id).maybeSingle();
            if (job) {
                console.log(`Assigned Job ID: ${job.job_number} | Type: ${job.type} | Status: ${job.status} | JobAssignTo: ${job.assigned_to} | AssignStatus: ${a.status}`);
            } else {
                console.log(`Assigned Job UUID ${a.job_id} -> ❌ NOT FOUND IN wms_jobs`);
            }
        }
    }
    
    // Find missing job codes
    const jobCodes = ['NWZM', '0S5W', 'W41Z', 'VW0P', 'AAAA0089', 'AAAA0091', 'AAAA0094', 'N80RTP', 'D8FW', 'RAQ1', 'DFF20F'];
    console.log('\n=== Looking up the specific codes the user listed ===');
    for (const code of jobCodes) {
        const { data } = await c.from('wms_jobs').select('id, type, status, assigned_to').ilike('job_number', '%'+code+'%');
        if (data && data.length > 0) {
            console.log(`Found ${code}: ID=${data[0].id} type=${data[0].type} status=${data[0].status} assigned_to=${data[0].assigned_to}`);
        } else {
            console.log(`❌ ${code} DOES NOT EXIST IN wms_jobs`);
        }
    }
    
    process.exit(0);
}

checkAbebeState();
