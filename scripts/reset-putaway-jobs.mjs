/**
 * Quick script to reset stuck PUTAWAY jobs in Supabase
 * Run with: node scripts/reset-putaway-jobs.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPutawayJobs() {
    console.log('🔍 Fetching all PUTAWAY jobs...');

    // Get all non-completed PUTAWAY jobs
    const { data: jobs, error: fetchError } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('type', 'PUTAWAY')
        .neq('status', 'Completed');

    if (fetchError) {
        console.error('❌ Error fetching jobs:', fetchError);
        return;
    }

    console.log(`📦 Found ${jobs.length} PUTAWAY jobs to reset`);

    for (const job of jobs) {
        console.log(`\n🔄 Resetting job: ${job.id}`);
        console.log(`   Current status: ${job.status}`);
        console.log(`   Assigned to: ${job.assigned_to || 'None'}`);
        console.log(`   Line items: ${job.line_items?.length || 0}`);

        // Reset line items
        const resetLineItems = (job.line_items || []).map(item => ({
            ...item,
            status: 'Pending',
            pickedQty: 0
        }));

        // Update the job
        const { data, error } = await supabase
            .from('wms_jobs')
            .update({
                status: 'Pending',
                assigned_to: null,
                line_items: resetLineItems
            })
            .eq('id', job.id)
            .select()
            .single();

        if (error) {
            console.error(`   ❌ Failed to reset:`, error.message);
        } else {
            console.log(`   ✅ Reset successful!`);
            console.log(`   New status: ${data.status}`);
        }
    }

    console.log('\n🎉 All jobs processed!');
    console.log('📋 Refresh your browser to see the changes.');
}

resetPutawayJobs();
