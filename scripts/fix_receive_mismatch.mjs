
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMismatch() {
    console.log('🔧 FIXING MISMATCHES...\n');

    // 1. Get job PW-PO79443-1
    const { data: job } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('job_number', 'PW-PO79443-1')
        .single();

    if (job) {
        console.log('Found job:', job.job_number);
        const oldProductId = job.line_items[0]?.productId;
        console.log('Current productId in job:', oldProductId);

        // Get the correct product ID from the PO item
        const { data: items } = await supabase
            .from('po_items')
            .select('product_id, product_name')
            .ilike('product_name', '%Dawa%')
            .not('product_id', 'is', null)
            .limit(1);

        if (items && items.length > 0) {
            const correctId = items[0].product_id;
            console.log('Correct productId from PO item:', correctId);

            // Update job line_items
            const updatedLineItems = job.line_items.map(li => ({
                ...li,
                productId: correctId
            }));

            const { error } = await supabase
                .from('wms_jobs')
                .update({ line_items: updatedLineItems })
                .eq('id', job.id);

            if (error) console.error('Update failed:', error);
            else console.log('✅ Job line_items updated!');
        }
    }

    // 2. Delete duplicate/orphan products
    const { data: products } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('created_at', { ascending: true });

    console.log('\n📦 Products to check:', products?.length);

    // Find duplicates by name
    const seen = new Map();
    const toDelete = [];

    for (const p of products || []) {
        const key = p.name.toLowerCase();
        if (seen.has(key)) {
            // This is a duplicate - delete older one
            toDelete.push(seen.get(key));
            seen.set(key, p.id); // Keep newer
        } else {
            seen.set(key, p.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`🗑️ Deleting ${toDelete.length} duplicate products...`);

        // First delete related records
        for (const id of toDelete) {
            await supabase.from('stock_movements').delete().eq('product_id', id);
        }

        // Then delete products
        const { error } = await supabase.from('products').delete().in('id', toDelete);
        if (error) console.error('Delete error:', error);
        else console.log('✅ Duplicates deleted');
    }

    console.log('\n✨ Fix complete!');
}

fixMismatch();
