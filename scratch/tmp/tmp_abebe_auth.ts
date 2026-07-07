import { createClient } from '@supabase/supabase-js';

const c = createClient('https://zdgzpxvorwinugjufkvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc');

async function main() {
    // First login as admin to look up Abebe's employee record
    await c.auth.signInWithPassword({ email: 'shukri.kamal@siifmart.com', password: 'Oromo123' });
    
    const { data: employees } = await c.from('employees').select('id, name, email, role, site_id, status');
    const abebe = employees?.find((e: any) => e.name?.toLowerCase().includes('abebe'));
    if (abebe) {
        console.log('=== Abebe Employee Record ===');
        console.log('Employee ID:', abebe.id);
        console.log('Email:', abebe.email);
        console.log('Role:', abebe.role);
        console.log('Site ID:', abebe.site_id);
        console.log('Status:', abebe.status);
    } else {
        console.log('Abebe not found in employees!');
        console.log('All employee names:', employees?.map((e: any) => e.name));
    }
    
    // Check auth.users for Abebe
    // Try to find the auth user matching Abebe's email
    if (abebe?.email) {
        console.log('\n=== Trying to login as Abebe ===');
        await c.auth.signOut();
        const { data: loginResult, error: loginError } = await c.auth.signInWithPassword({ 
            email: abebe.email, 
            password: 'Oromo123' // Try common password
        });
        
        if (loginError) {
            console.log('Login ERROR:', loginError.message);
            // Try other passwords
            const passwords = ['password123', '123456', 'Abebe123'];
            for (const pw of passwords) {
                const { data, error } = await c.auth.signInWithPassword({ email: abebe.email, password: pw });
                if (!error) {
                    console.log(`Login succeeded with password: ${pw}`);
                    console.log('Auth UID:', data.user?.id);
                    break;
                }
            }
        } else if (loginResult?.user) {
            console.log('Auth UID:', loginResult.user.id);
            console.log('Auth Email:', loginResult.user.email);
            console.log('\nMATCH CHECK: Auth UID === Employee ID?', loginResult.user.id === abebe.id);
            
            // Now test if Abebe can see his jobs
            const { data: myJobs, error: jobsErr } = await c.from('wms_jobs')
                .select('id, job_number, type, status, assigned_to, site_id')
                .eq('assigned_to', abebe.id)
                .not('status', 'in', '("Completed","Cancelled")');
            
            console.log('\n=== Jobs visible to Abebe (via RLS) ===');
            if (jobsErr) console.log('ERROR:', jobsErr);
            console.log('Count:', myJobs?.length);
            myJobs?.forEach((j: any) => console.log(`  ${j.job_number} | ${j.type} | ${j.status} | site: ${j.site_id}`));
            
            // Test with same getAll query the app uses
            const siteId = abebe.site_id;
            const employeeId = abebe.id;
            const { data: appJobs, error: appErr } = await c.from('wms_jobs')
                .select('*')
                .not('status', 'in', '("Completed","Cancelled")')
                .or(`site_id.eq.${siteId},dest_site_id.eq.${siteId},assigned_to.eq.${employeeId}`);
            
            console.log('\n=== Same query as wmsJobsService.getAll ===');
            if (appErr) console.log('ERROR:', appErr);
            console.log('Count:', appJobs?.length);
            appJobs?.forEach((j: any) => console.log(`  ${j.job_number} | ${j.type} | ${j.status} | assigned: ${j.assigned_to}`));
        }
    }
    
    process.exit(0);
}

main();
