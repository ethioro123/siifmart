/**
 * Migration Script: Populate job_number for existing WMS jobs
 * 
 * Run this script to update all existing jobs that have NULL job_number
 * with a proper human-readable job number.
 * 
 * Usage: Execute this in the browser console or as a standalone script
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function migrateJobNumbers(): Promise<{ updated: number; errors: string[] }> {
    console.log('🚀 Starting Job Number Migration...\n');

    const errors: string[] = [];
    let updated = 0;

    try {
        // 1. Fetch all jobs without job_number
        const { data: jobs, error: fetchError } = await supabase
            .from('wms_jobs')
            .select('id, type, site_id, created_at')
            .is('job_number', null)
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('❌ Error fetching jobs:', fetchError);
            return { updated: 0, errors: [fetchError.message] };
        }

        if (!jobs || jobs.length === 0) {
            console.log('✅ No jobs need migration - all have job_number');
            return { updated: 0, errors: [] };
        }

        console.log(`📦 Found ${jobs.length} jobs without job_number`);

        // 2. Group jobs by type to generate sequential numbers per type
        const typeCounters: Record<string, number> = {
            'PICK': 0,
            'PACK': 0,
            'PUTAWAY': 0,
            'TRANSFER': 0,
            'DISPATCH': 0
        };

        // 3. Get current max numbers for each type
        for (const type of Object.keys(typeCounters)) {
            const prefix = type === 'PICK' ? 'PICK' :
                type === 'PACK' ? 'PACK' :
                    type === 'PUTAWAY' ? 'PUT' :
                        type === 'TRANSFER' ? 'TRF' :
                            type === 'DISPATCH' ? 'DSP' : 'JOB';

            const { data: existing } = await supabase
                .from('wms_jobs')
                .select('job_number')
                .eq('type', type)
                .not('job_number', 'is', null)
                .order('job_number', { ascending: false })
                .limit(1);

            if (existing && existing.length > 0) {
                const match = existing[0].job_number?.match(/\d+/);
                if (match) {
                    typeCounters[type] = parseInt(match[0], 10);
                }
            }
        }

        // 4. Update each job with a new job_number
        for (const job of jobs) {
            const type = job.type || 'JOB';
            typeCounters[type] = (typeCounters[type] || 0) + 1;

            const prefix = type === 'PICK' ? 'PICK' :
                type === 'PACK' ? 'PACK' :
                    type === 'PUTAWAY' ? 'PUT' :
                        type === 'TRANSFER' ? 'TRF' :
                            type === 'DISPATCH' ? 'DSP' : 'JOB';

            const newJobNumber = `${prefix}-${String(typeCounters[type]).padStart(4, '0')}`;

            const { error: updateError } = await supabase
                .from('wms_jobs')
                .update({ job_number: newJobNumber })
                .eq('id', job.id);

            if (updateError) {
                console.error(`❌ Failed to update job ${job.id}:`, updateError);
                errors.push(`Job ${job.id}: ${updateError.message}`);
            } else {
                console.log(`✅ ${job.id} → ${newJobNumber}`);
                updated++;
            }
        }

        console.log(`\n✨ Migration Complete! ${updated}/${jobs.length} jobs updated`);
        if (errors.length > 0) {
            console.log(`⚠️ ${errors.length} errors occurred`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        errors.push(String(error));
    }

    return { updated, errors };
}

// Auto-run function that can be called from the browser console
// or triggered on app initialization
export async function runJobNumberMigration() {
    // Check if already migrated recently
    const lastMigration = localStorage.getItem('jobNumberMigration');
    const now = Date.now();

    // Only run once per day
    if (lastMigration && now - parseInt(lastMigration) < 24 * 60 * 60 * 1000) {
        console.log('⏭️ Job number migration already ran today');
        return;
    }

    const result = await migrateJobNumbers();

    if (result.updated > 0) {
        localStorage.setItem('jobNumberMigration', String(now));
        console.log('🔄 Refresh the page to see updated job numbers');
    }

    return result;
}
