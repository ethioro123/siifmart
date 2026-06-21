import { createClient } from '@supabase/supabase-js';

const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

/**
 * Fix: Assign orphaned PACK jobs to the worker who completed their parent PICK job.
 * This resolves the existing unassigned PACK jobs that were created before the fix.
 */
async function fixOrphanedPackJobs() {
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    // Find all active PACK jobs with no assignee
    const { data: unassignedPacks } = await c.from('wms_jobs')
        .select('id, job_number, order_ref, site_id, status')
        .eq('type', 'PACK')
        .is('assigned_to', null)
        .not('status', 'in', '("Completed","Cancelled")');
    
    console.log(`Found ${unassignedPacks?.length || 0} unassigned PACK jobs`);
    
    let fixed = 0;
    for (const pack of (unassignedPacks || [])) {
        // Find the completed PICK job with the same orderRef
        const { data: pickJob } = await c.from('wms_jobs')
            .select('assigned_to, job_number')
            .eq('order_ref', pack.order_ref)
            .eq('type', 'PICK')
            .not('assigned_to', 'is', null)
            .limit(1)
            .maybeSingle();
        
        if (pickJob?.assigned_to) {
            console.log(`  Fixing ${pack.job_number}: assigning to ${pickJob.assigned_to} (from PICK ${pickJob.job_number})`);
            await c.from('wms_jobs')
                .update({ 
                    assigned_to: pickJob.assigned_to,
                    assigned_by: 'Auto-Chain-Fix'
                })
                .eq('id', pack.id);
            fixed++;
        } else {
            console.log(`  ${pack.job_number}: No parent PICK with assignee found (orderRef: ${pack.order_ref})`);
        }
    }
    
    console.log(`\n✅ Fixed ${fixed} of ${unassignedPacks?.length || 0} unassigned PACK jobs`);
    process.exit(0);
}

fixOrphanedPackJobs();
