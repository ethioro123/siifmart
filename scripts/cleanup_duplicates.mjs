
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Attempt to use SERVICE ROLE KEY if available (for deletion), else Anon

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('🧹 Starting Cleanup Process...');

    // --- 1. CLEANUP JOBS ---
    const { data: jobs, error: jError } = await supabase
        .from('wms_jobs')
        .select('id, job_number, site_id, status, created_at');

    if (jError) console.error('Error fetching jobs:', jError);
    else {
        const jobGroups = new Map();
        jobs.forEach(j => {
            if (!j.job_number) return;
            const key = `${j.job_number}-${j.site_id}`;
            if (!jobGroups.has(key)) jobGroups.set(key, []);
            jobGroups.get(key).push(j);
        });

        let deletedJobs = 0;
        for (const [key, group] of jobGroups) {
            if (group.length > 1) {
                // Sort: Completed first, then newest Created
                group.sort((a, b) => {
                    if (a.status === 'Completed' && b.status !== 'Completed') return -1;
                    if (b.status === 'Completed' && a.status !== 'Completed') return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                const toKeep = group[0];
                const toDelete = group.slice(1);
                const idsToDelete = toDelete.map(j => j.id);

                console.log(`🗑️ Deleting ${idsToDelete.length} duplicates for Job ${key} (Keeping ${toKeep.id} - ${toKeep.status})`);

                const { error: delErr } = await supabase
                    .from('wms_jobs')
                    .delete()
                    .in('id', idsToDelete);

                if (delErr) {
                    console.error('Failed to delete jobs:', delErr);
                } else {
                    deletedJobs += idsToDelete.length;
                }
            }
        }
        console.log(`✅ Cleaned up ${deletedJobs} duplicate jobs.`);
    }

    // --- 2. CLEANUP PRODUCTS ---
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, sku, site_id, stock, created_at');

    if (pError) console.error('Error fetching products:', pError);
    else {
        const prodGroups = new Map();
        products.forEach(p => {
            if (!p.sku) return;
            const key = `${p.sku}-${p.site_id}`;
            if (!prodGroups.has(key)) prodGroups.set(key, []);
            prodGroups.get(key).push(p);
        });

        let deletedProds = 0;
        for (const [key, group] of prodGroups) {
            if (group.length > 1) {
                // Sort: Highest Stock first, then newest
                group.sort((a, b) => {
                    if (b.stock !== a.stock) return b.stock - a.stock;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                const toKeep = group[0];
                const toDelete = group.slice(1);
                const idsToDelete = toDelete.map(p => p.id);

                console.log(`🗑️ Deleting ${idsToDelete.length} duplicates for SKU ${key} (Keeping ${toKeep.id} - Stock: ${toKeep.stock})`);

                const { error: delErr } = await supabase
                    .from('products')
                    .delete()
                    .in('id', idsToDelete);

                if (delErr) {
                    console.error('Failed to delete products:', delErr);
                } else {
                    deletedProds += idsToDelete.length;
                }
            }
        }
        console.log(`✅ Cleaned up ${deletedProds} duplicate products.`);
    }
}

cleanupDuplicates();
