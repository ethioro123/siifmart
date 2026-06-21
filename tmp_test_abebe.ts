import { createClient } from '@supabase/supabase-js';

const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function testAbebeView() {
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    // 1. Get raw jobs
    const activeQuery = c.from('wms_jobs')
        .select('*')
        .not('status', 'in', '("Completed","Cancelled")');
    const { data: rawJobs, error } = await activeQuery;
    if(error) console.error(error);
    
    const jobs = rawJobs.map((j: any) => ({
        ...j,
        siteId: j.site_id,
        assignedTo: j.assigned_to,
        orderRef: j.order_ref,
        jobNumber: j.job_number,
    }));
    
    // Abebe's info
    const employeeId = '4d527609-63ca-430d-a777-557eb6405a35';
    const siteId = '96719be0-77de-4445-a8fe-e9713111255a';
    const userRole = 'picker';
    
    // 2. FilterBySite (from data context)
    const siteFiltered = jobs.filter((j: any) => j.siteId === siteId || j.dest_site_id === siteId);
    const explicitlyAssigned = jobs.filter((j: any) => j.assignedTo === employeeId && !siteFiltered.some((sf: any) => sf.id === j.id));
    const baseFiltered = [...siteFiltered, ...explicitlyAssigned];
    
    // 3. Role-based filtering
    const roleFiltered = baseFiltered.filter((j: any) => j.assignedTo === employeeId);
    
    // 4. Tab filtering (PickTab)
    const transferStatusMap = new Map();
    roleFiltered.forEach((j: any) => {
        if (j.type === 'TRANSFER') transferStatusMap.set(j.id, j.transfer_status || 'Requested');
    });
    
    const APPROVED_STATUSES = ['Approved', 'Picking', 'Picked', 'Packed', 'Shipped', 'In-Transit', 'Delivered', 'Received'];
    
    const pickTabJobs = roleFiltered.filter((j: any) => {
        if (j.type !== 'PICK') return false;
        if (j.status === 'Completed') return false;
        if (j.assignedTo && j.assignedTo !== employeeId && !['admin'].includes(userRole)) return false;
        
        const linkedTransferStatus = transferStatusMap.get(j.orderRef || '');
        if (linkedTransferStatus !== undefined) {
             return APPROVED_STATUSES.includes(linkedTransferStatus);
        }
        return true;
    });
    
    console.log('Abebe PickTab Jobs count:', pickTabJobs.length);
    pickTabJobs.forEach((j: any) => console.log(' ->', j.jobNumber, j.status));
    process.exit(0);
}
testAbebeView();
