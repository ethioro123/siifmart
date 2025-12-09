import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDuplicates() {
    console.log('🔍 Checking for duplicate WMS jobs...');

    const { data: jobs, error } = await supabase
        .from('wms_jobs')
        .select('id, order_ref, type, status, created_at');

    if (error) {
        console.error('❌ Error fetching jobs:', error.message);
        return;
    }

    const orderMap = new Map<string, any[]>();
    let duplicateCount = 0;

    jobs.forEach(job => {
        if (!job.order_ref) return;

        if (!orderMap.has(job.order_ref)) {
            orderMap.set(job.order_ref, []);
        }
        orderMap.get(job.order_ref)?.push(job);
    });

    for (const [orderRef, jobList] of orderMap.entries()) {
        const putawayJobs = jobList.filter(j => j.type === 'PUTAWAY');

        if (putawayJobs.length > 1) {
            // Check if they are duplicates (created very close to each other)
            // Or just multiple items? 
            // Usually 1 PO = Multiple Jobs (one per line item) is OK.
            // But if we have Identical Jobs (same items), that's bad.

            console.log(`\n⚠️  PO ${orderRef} has ${putawayJobs.length} Putaway jobs.`);
            putawayJobs.forEach(j => {
                console.log(`   - Job ${j.id} (${j.status}) Created: ${j.created_at}`);
            });

            // Heuristic: If created_at is identical, likely duplicate
            const timestamps = putawayJobs.map(j => j.created_at);
            const uniqueTimestamps = new Set(timestamps);
            if (uniqueTimestamps.size < timestamps.length) {
                console.log('   🚨 POTENTIAL DUPLICATES DETECTED (Same Timestamp)');
                duplicateCount++;
            }
        }
    }

    if (duplicateCount === 0) {
        console.log('\n✅ No obvious timestamp duplicates found.');
    } else {
        console.log(`\n⚠️  Found ${duplicateCount} potential duplicate sets.`);
    }
}

checkDuplicates();
