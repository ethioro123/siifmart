
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function healthCheck() {
    console.log('🏥 Performing System Health Check...');

    // 1. Fetch Sites
    const { data: sites, error: sError } = await supabase.from('sites').select('id, name, type');
    if (sError) { console.error('Error fetching sites:', sError); return; }

    console.log(`\n📍 Found ${sites.length} Sites:`);
    sites.forEach(s => console.log(`   - [${s.id}] ${s.name} (${s.type})`));

    const siteIds = new Set(sites.map(s => s.id));

    // 2. Check Products Site Distribution
    const { data: products } = await supabase.from('products').select('id, site_id');
    const prodDistrib = {};
    let prodOrphans = 0;

    if (products) {
        products.forEach(p => {
            const sid = p.site_id || 'NULL';
            if (sid !== 'NULL' && !siteIds.has(sid)) prodOrphans++;
            prodDistrib[sid] = (prodDistrib[sid] || 0) + 1;
        });
        console.log('\n📦 Products Distribution:', prodDistrib);
        if (prodOrphans > 0) console.error(`⚠️  ${prodOrphans} Products have invalid/unknown site_id!`);
    }

    // 3. Check Jobs Site Distribution
    const { data: jobs } = await supabase.from('wms_jobs').select('id, site_id, job_number, status');
    const jobDistrib = {};
    let jobOrphans = 0;

    if (jobs) {
        jobs.forEach(j => {
            const sid = j.site_id || 'NULL';
            if (sid !== 'NULL' && !siteIds.has(sid)) jobOrphans++;
            jobDistrib[sid] = (jobDistrib[sid] || 0) + 1;
        });
        console.log('\n📋 Jobs Distribution:', jobDistrib);
        if (jobOrphans > 0) console.error(`⚠️  ${jobOrphans} Jobs have invalid/unknown site_id!`);
    }

    // 4. Check POs (Orders)
    const { data: orders } = await supabase.from('orders').select('id, site_id, status');
    const orderDistrib = {};

    if (orders) {
        orders.forEach(o => {
            const sid = o.site_id || 'NULL';
            orderDistrib[sid] = (orderDistrib[sid] || 0) + 1;
        });
        console.log('\n🛒 Orders Distribution:', orderDistrib);
    }

}

healthCheck();
