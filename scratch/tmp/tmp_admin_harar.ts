import { createClient } from '@supabase/supabase-js';

const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function testAdminViewingHarar() {
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    const HARAR_SITE_ID = '96719be0-77de-4445-a8fe-e9713111255a';
    const SHUKRI_ID = '6937384b-2ecc-442f-b5a4-1b132e0f2b0a';
    
    // Simulate exactly what FulfillmentDataProvider does (line 167):
    // wmsJobsService.getAll(activeSiteId, 500, employeeId)
    // where activeSiteId = Harar, employeeId = Shukri (the logged-in user)
    
    console.log('=== Simulating FulfillmentDataProvider.loadFulfillmentData ===');
    console.log('activeSiteId:', HARAR_SITE_ID, '(Harar Logistics Hub)');
    console.log('employeeId:', SHUKRI_ID, '(Shukri - logged in user)');
    
    // Active jobs
    const { data: activeJobs, error: activeErr } = await c.from('wms_jobs')
        .select('*')
        .not('status', 'in', '("Completed","Cancelled")')
        .or(`site_id.eq.${HARAR_SITE_ID},dest_site_id.eq.${HARAR_SITE_ID},assigned_to.eq.${SHUKRI_ID}`)
        .order('created_at', { ascending: true });
    
    if (activeErr) console.error('Active query error:', activeErr);
    
    console.log('\n=== Active Jobs returned (non-Completed, non-Cancelled) ===');
    console.log('Total:', activeJobs?.length);
    activeJobs?.forEach((j: any) => {
        console.log(`  ${j.job_number || 'NO-NUM'} | ${j.type} | ${j.status} | assigned: ${j.assigned_to || 'NONE'} | site: ${j.site_id}`);
    });
    
    // Check Abebe's jobs specifically 
    const ABEBE_ID = '4d527609-63ca-430d-a777-557eb6405a35';
    const abebeJobs = activeJobs?.filter((j: any) => j.assigned_to === ABEBE_ID);
    console.log(`\n=== Abebe's jobs in this result set ===`);
    console.log('Count:', abebeJobs?.length);
    abebeJobs?.forEach((j: any) => {
        console.log(`  ${j.job_number} | ${j.type} | ${j.status}`);
    });
    
    // Now simulate the useFilteredFulfillmentData with super_admin + activeSite = Harar
    const allJobs = activeJobs?.map((j: any) => ({
        ...j,
        siteId: j.site_id,
        assignedTo: j.assigned_to,
        destSiteId: j.dest_site_id,
    })) || [];
    
    // canSeeGlobalQueue for super_admin = TRUE
    // So roleFiltered = baseFiltered (no restriction for super_admin)
    // But line 101-108: super_admin prunes to exactly the selected site
    
    const pruned = allJobs.filter((j: any) => {
        const siteId = j.siteId || j.site_id;
        const destSiteId = j.destSiteId || j.dest_site_id;
        return siteId === HARAR_SITE_ID || destSiteId === HARAR_SITE_ID;
    });
    
    console.log(`\n=== After super_admin site pruning ===`);
    console.log('Count:', pruned.length);
    
    const pickJobs = pruned.filter((j: any) => j.type === 'PICK' && j.status !== 'Completed');
    console.log('\n=== PICK jobs visible in Pick tab ===');
    console.log('Count:', pickJobs.length);
    pickJobs.forEach((j: any) => console.log(`  ${j.job_number} | ${j.status} | assigned: ${j.assignedTo}`));
    
    process.exit(0);
}

testAdminViewingHarar();
