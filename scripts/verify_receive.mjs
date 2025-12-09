
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReceive() {
    console.log('Verifying Receive for PO-TEST-003 (Adama)...');

    // 1. Check Job
    const { data: jobs } = await supabase.from('wms_jobs')
        .select('id, job_number, status, site_id, line_items')
        .ilike('job_number', '%PO-TEST-003%');

    if (jobs && jobs.length > 0) {
        console.log(`✅ Found ${jobs.length} jobs:`);
        jobs.forEach(j => {
            console.log(`- ${j.job_number} (${j.status}) Site: ${j.site_id}`);
            if (j.line_items) console.log('  Items:', j.line_items.map(i => `${i.name} (PrdID: ${i.productId})`));
        });
    } else {
        console.log('❌ No jobs found for PO-TEST-003.');
    }

    // 2. Check Product "Test Item Z"
    const { data: products } = await supabase.from('products')
        .select('id, name, sku, site_id, stock')
        .ilike('name', '%Test Item Z%');

    if (products && products.length > 0) {
        console.log(`✅ Found ${products.length} products matching "Test Item Z":`);
        products.forEach(p => console.log(`- [${p.sku}] ${p.name} (Site: ${p.site_id}) Stock: ${p.stock}`));
    } else {
        console.log('❌ No product "Test Item Z" found.');
    }
}

verifyReceive();
