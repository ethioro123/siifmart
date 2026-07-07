import { createClient } from '@supabase/supabase-js';
const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function run() {
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    const ABEBE_EMP_ID = '4d527609-63ca-430d-a777-557eb6405a35';
    const HARAR_SITE = '96719be0-77de-4445-a8fe-e9713111255a';
    
    // Simulate EXACTLY what FulfillmentDataProvider does for Abebe
    // user.email = abebe.yilma@siifmart.com, user.id = auth.uid()
    // Step 1: Find employee by email
    const allEmps = await c.from('employees').select('*');
    const abebeEmp = allEmps.data?.find((e: any) => e.email === 'abebe.yilma@siifmart.com');
    console.log('Employee match by email:', abebeEmp?.id, abebeEmp?.name, abebeEmp?.role);
    
    const employeeId = abebeEmp?.id; // This is what gets passed to wmsJobsService.getAll
    console.log('Resolved employeeId for getAll query:', employeeId);
    
    // Step 2: wmsJobsService.getAll(HARAR_SITE, 500, employeeId)
    // Active query: or(site_id.eq.HARAR, dest_site_id.eq.HARAR, assigned_to.eq.employeeId)
    const { data: activeJobs } = await c.from('wms_jobs')
        .select('*')
        .not('status', 'in', '("Completed","Cancelled")')
        .or(`site_id.eq.${HARAR_SITE},dest_site_id.eq.${HARAR_SITE},assigned_to.eq.${employeeId}`);
    
    console.log('\nActive jobs fetched:', activeJobs?.length);
    
    // Filter like useFilteredFulfillmentData does for a "picker" role
    // canSeeGlobalQueue = false for picker
    // roleFiltered = baseFiltered.filter(j => j.assignedTo === employeeId)
    const myJobs = activeJobs?.filter((j: any) => j.assigned_to === employeeId) || [];
    console.log('\nJobs assigned to Abebe after role filter:', myJobs.length);
    myJobs.forEach((j: any) => console.log(`  ${j.job_number} | ${j.type} | ${j.status} | assigned: ${j.assigned_to}`));
    
    // Check PACK specifically
    const myPacks = myJobs.filter((j: any) => j.type === 'PACK');
    console.log('\nPACK jobs assigned to Abebe:', myPacks.length);
    
    // Also check: historical PACK jobs for Abebe
    const { data: histJobs } = await c.from('wms_jobs')
        .select('id, job_number, type, status, assigned_to')
        .eq('type', 'PACK')
        .or(`site_id.eq.${HARAR_SITE},dest_site_id.eq.${HARAR_SITE},assigned_to.eq.${employeeId}`)
        .in('status', ['Completed', 'Cancelled']);
    
    const myHistPacks = histJobs?.filter((j: any) => j.assigned_to === employeeId) || [];
    console.log('\nHistorical (Completed) PACK jobs assigned to Abebe:', myHistPacks.length);
    myHistPacks.forEach((j: any) => console.log(`  ${j.job_number} | ${j.status}`));
    
    process.exit(0);
}
run();
