
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log('🔍 Checking for duplicates...');

    // 1. Check Products (Same SKU + Site)
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, sku, site_id, stock, created_at');

    if (pError) {
        console.error('Error fetching products:', pError);
    } else {
        const skuMap = new Map();
        const duplicates = [];

        products.forEach(p => {
            const key = `${p.sku}-${p.site_id}`;
            // Ignore undefined/null SKUs if necessary, but usually SKU should exist
            if (!p.sku) return;

            if (skuMap.has(key)) {
                duplicates.push({ original: skuMap.get(key), duplicate: p });
            } else {
                skuMap.set(key, p);
            }
        });

        console.log(`\n📦 Products Analysis: ${products.length} total rows.`);
        if (duplicates.length > 0) {
            console.log(`⚠️ FOUND ${duplicates.length} DUPLICATE PRODUCTS (Same SKU + Site):`);
            duplicates.forEach(d => {
                console.log(`   - SKU: ${d.duplicate.sku} | Site: ${d.duplicate.site_id}`);
                console.log(`     Original ID: ${d.original.id} (Stock: ${d.original.stock})`);
                console.log(`     Duplicate ID: ${d.duplicate.id} (Stock: ${d.duplicate.stock})`);
            });
        } else {
            console.log('✅ No duplicate products found.');
        }
    }

    // 2. Check WMS Jobs (Same Job Number + Site)
    const { data: jobs, error: jError } = await supabase
        .from('wms_jobs')
        .select('id, job_number, site_id, status, type, created_at');

    if (jError) {
        console.error('Error fetching jobs:', jError);
    } else {
        const jobMap = new Map();
        const jobDups = [];

        jobs.forEach(j => {
            // Job Number is the human-readable ID
            const key = `${j.job_number}-${j.site_id}`;
            if (!j.job_number) return;

            if (jobMap.has(key)) {
                jobDups.push({ original: jobMap.get(key), duplicate: j });
            } else {
                jobMap.set(key, j);
            }
        });

        console.log(`\n📋 WMS Jobs Analysis: ${jobs.length} total rows.`);
        if (jobDups.length > 0) {
            console.log(`⚠️ FOUND ${jobDups.length} DUPLICATE JOBS (Same Job Number + Site):`);
            jobDups.forEach(d => {
                console.log(`   - Job #: ${d.duplicate.job_number} | Site: ${d.duplicate.site_id}`);
                console.log(`     Orig: ${d.original.id} (${d.original.status})`);
                console.log(`     Dup:  ${d.duplicate.id} (${d.duplicate.status})`);
            });
        } else {
            console.log('✅ No duplicate jobs found.');
        }
    }

    // 3. Check Purchase Orders
    const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, po_number, site_id, status');

    if (poError) {
        console.error('Error fetching POs:', poError);
    } else {
        const poMap = new Map();
        const poDups = [];

        pos.forEach(p => {
            const key = `${p.po_number}-${p.site_id}`;
            if (!p.po_number) return;

            if (poMap.has(key)) {
                poDups.push({ original: poMap.get(key), duplicate: p });
            } else {
                poMap.set(key, p);
            }
        });

        console.log(`\n📄 Purchase Orders Analysis: ${pos.length} total rows.`);
        if (poDups.length > 0) {
            console.log(`⚠️ FOUND ${poDups.length} DUPLICATE POs (Same PO Number + Site):`);
            poDups.forEach(d => {
                console.log(`   - PO #: ${d.duplicate.po_number} | Site: ${d.duplicate.site_id}`);
            });
        } else {
            console.log('✅ No duplicate purchase orders found.');
        }
    }
}

checkDuplicates();
