import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    // Fetch ALL jobs, no filter
    const { data: allJobs, error } = await supabase
        .from('wms_jobs')
        .select('id, job_number, type, status, order_ref, assigned_to, items_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) { console.error('Error:', error); return; }
    
    console.log(`Total jobs fetched: ${allJobs?.length || 0}\n`);
    
    // Group by status
    const byStatus: Record<string, any[]> = {};
    for (const j of (allJobs || [])) {
        const s = j.status || 'NULL';
        if (!byStatus[s]) byStatus[s] = [];
        byStatus[s].push(j);
    }
    
    for (const [status, jobs] of Object.entries(byStatus)) {
        console.log(`--- ${status}: ${jobs.length} jobs ---`);
        for (const j of jobs.slice(0, 5)) {
            console.log(`  ${j.type} | ${j.job_number} | assigned: ${j.assigned_to?.slice(0, 8) || 'none'} | ref: ${j.order_ref?.slice(0, 8) || 'none'} | ${j.created_at}`);
        }
        if (jobs.length > 5) console.log(`  ... and ${jobs.length - 5} more`);
    }

    // Specifically look for the job numbers from the UI
    console.log('\n=== Searching for specific job numbers from UI ===');
    for (const num of ['AAAA0089', 'AAAA0091', 'AAAA0094']) {
        const { data, error: e2 } = await supabase
            .from('wms_jobs')
            .select('id, job_number, type, status, order_ref, assigned_to')
            .eq('job_number', num);
        
        if (e2) { console.log(`  ${num}: error`, e2); continue; }
        if (!data || data.length === 0) { console.log(`  ${num}: NOT FOUND in database`); continue; }
        console.log(`  ${num}: FOUND — status=${data[0].status}, type=${data[0].type}, ref=${data[0].order_ref}`);
    }
}

checkAll();
