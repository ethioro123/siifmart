
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupBrokenJobs() {
    console.log('🧹 finding Broken Jobs (items pointing to missing products)...');

    // 1. Get all Jobs
    const { data: jobs } = await supabase.from('wms_jobs').select('*');
    // 2. Get all Product IDs
    const { data: products } = await supabase.from('products').select('id');
    const productIds = new Set(products.map(p => p.id));

    const jobsToDelete = [];

    for (const job of jobs) {
        if (!job.line_items || !Array.isArray(job.line_items)) continue;
        let isBroken = false;
        for (const item of job.line_items) {
            if (item.productId && !productIds.has(item.productId)) {
                console.log(`❌ Job ${job.job_number} (Site: ${job.site_id}) has item "${item.name}" pointing to missing product ${item.productId}`);
                isBroken = true;
            }
        }
        if (isBroken) jobsToDelete.push(job.id);
    }

    if (jobsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${jobsToDelete.length} broken jobs...`);
        const { error } = await supabase.from('wms_jobs').delete().in('id', jobsToDelete);
        if (error) console.error(error);
        else console.log('✅ Deleted broken jobs.');
    } else {
        console.log('✅ No broken jobs found.');
    }
}

cleanupBrokenJobs();
