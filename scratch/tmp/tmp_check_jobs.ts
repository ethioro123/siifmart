import { createClient } from '@supabase/supabase-js';

const client = createClient(
    'https://zdgzpxvorwinugjufkvb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc'
);

async function main() {
    await client.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });

    // Check if those specific job codes exist
    const jobCodes = ['NWZM', '0S5W', 'W41Z', 'VW0P', 'AAAA0089', 'AAAA0091', 'AAAA0094', 'N80RTP', 'D8FW', 'RAQ1', 'DFF20F'];
    
    console.log('=== Searching for specific job codes ===');
    for (const code of jobCodes) {
        const { data } = await client.from('wms_jobs')
            .select('id, job_id, type, status, assigned_to')
            .eq('job_id', code);
        if (data && data.length > 0) {
            data.forEach(j => console.log(`  ✅ FOUND: ${j.job_id} | ${j.type} | status: ${j.status} | assigned: ${j.assigned_to}`));
        } else {
            console.log(`  ❌ NOT FOUND: ${code}`);
        }
    }

    // Check the 38 Pending + 26 In-Progress jobs
    console.log('\n=== Pending jobs (38) ===');
    const { data: pending } = await client.from('wms_jobs')
        .select('id, job_id, type, status, assigned_to, site_id')
        .eq('status', 'Pending')
        .limit(40);
    pending?.forEach(j => console.log(`  ${j.type} ${j.job_id} | assigned: ${j.assigned_to || 'NONE'} | site: ${j.site_id}`));

    console.log('\n=== In-Progress jobs (26) ===');
    const { data: inProg } = await client.from('wms_jobs')
        .select('id, job_id, type, status, assigned_to, site_id')
        .eq('status', 'In-Progress')
        .limit(30);
    inProg?.forEach(j => console.log(`  ${j.type} ${j.job_id} | assigned: ${j.assigned_to || 'NONE'} | site: ${j.site_id}`));

    // Count orphaned job_assignments (point to non-existent wms_jobs)
    console.log('\n=== Orphaned job_assignments (all users) ===');
    const { data: allAssigns } = await client.from('job_assignments').select('id, job_id, employee_id, status');
    let orphaned = 0;
    let valid = 0;
    if (allAssigns) {
        for (const a of allAssigns) {
            const { data: job } = await client.from('wms_jobs').select('id').eq('id', a.job_id).single();
            if (!job) orphaned++;
            else valid++;
        }
    }
    console.log(`  Total assignments: ${allAssigns?.length || 0}`);
    console.log(`  Valid (job exists): ${valid}`);
    console.log(`  Orphaned (ghost): ${orphaned}`);

    await client.auth.signOut();
    process.exit(0);
}
main().catch(console.error);
