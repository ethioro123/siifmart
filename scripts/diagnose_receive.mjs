
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 DIAGNOSING RECEIVE FLOW...\n');

    // 1. Get recent POs
    const { data: pos } = await supabase
        .from('purchase_orders')
        .select('id, po_number, site_id, status')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('📋 Recent Purchase Orders:');
    for (const po of pos || []) {
        console.log(`\n  PO: ${po.po_number} (${po.status})`);

        // Get PO Items
        const { data: items } = await supabase
            .from('po_items')
            .select('id, product_name, product_id, quantity')
            .eq('po_id', po.id);

        console.log('  Line Items:');
        for (const item of items || []) {
            const hasProductId = item.product_id ? '✅' : '❌';
            console.log(`    ${hasProductId} ${item.product_name} (Qty: ${item.quantity}) | product_id: ${item.product_id || 'NULL'}`);
        }

        // Get Jobs for this PO
        const { data: jobs } = await supabase
            .from('wms_jobs')
            .select('id, job_number, status, line_items')
            .eq('order_ref', po.id);

        console.log(`  Jobs (${jobs?.length || 0}):`);
        for (const job of jobs || []) {
            console.log(`    📦 ${job.job_number} (${job.status})`);
            for (const li of job.line_items || []) {
                console.log(`       - ${li.name} | productId: ${li.productId} | qty: ${li.expectedQty}`);
            }
        }
    }

    // 2. Check for mismatch
    console.log('\n\n🔎 CHECKING FOR MISMATCHES...');

    // Get all PO items with NULL product_id
    const { data: nullItems } = await supabase
        .from('po_items')
        .select('id, product_name, po_id')
        .is('product_id', null);

    if (nullItems && nullItems.length > 0) {
        console.log(`\n⚠️  Found ${nullItems.length} PO Items with NULL product_id:`);
        nullItems.forEach(i => console.log(`   - ${i.product_name} (po_item.id: ${i.id})`));
    } else {
        console.log('\n✅ All PO Items have product_id set');
    }

    // 3. Check recent products
    const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, site_id, stock')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n\n📦 Recent Products:');
    products?.forEach(p => {
        console.log(`  - [${p.sku}] ${p.name} | Stock: ${p.stock} | ID: ${p.id}`);
    });
}

diagnose();
