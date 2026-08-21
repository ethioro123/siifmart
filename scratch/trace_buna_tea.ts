import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function traceBunaTea() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=========================================");
    console.log("=== TRACING BUNA TEA ACROSS ALL TABLES ===");
    console.log("=========================================\n");

    // 1. Products table
    const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .or('sku.eq.PA0001,name.ilike.%Buna%');
    console.log(`[1] PRODUCTS TABLE (${products?.length || 0} records):`);
    (products || []).forEach(p => {
        console.log(`  - ID: ${p.id} | Site: ${p.site_id} | Stock: ${p.stock} ${p.unit || ''} | Size: ${p.size || 'N/A'} | Location: ${p.location || 'N/A'}`);
    });

    // 2. Stock Movements table
    const { data: movements, error: mErr } = await supabase
        .from('stock_movements')
        .select('*')
        .or('product_name.ilike.%Buna%,product_id.in.(' + (products || []).map(p => `"${p.id}"`).join(',') + ')');
    console.log(`\n[2] STOCK MOVEMENTS TABLE (${movements?.length || 0} records):`);
    (movements || []).forEach(m => {
        console.log(`  - ID: ${m.id} | Type: ${m.type} | Qty: ${m.quantity} | Reason: ${m.reason} | Site: ${m.site_id} | Date: ${m.movement_date}`);
    });

    // 3. WMS Jobs / Fulfillment Jobs
    const { data: jobs, error: jErr } = await supabase
        .from('wms_jobs')
        .select('*');
    const bunaJobs = (jobs || []).filter(j => {
        const str = JSON.stringify(j);
        return str.toLowerCase().includes('buna') || str.includes('PA0001');
    });
    console.log(`\n[3] WMS JOBS TABLE (${bunaJobs.length} matching jobs out of ${jobs?.length || 0}):`);
    bunaJobs.forEach(j => {
        console.log(`  - Job ID: ${j.id} | No: ${j.job_number} | Type: ${j.type} | Status: ${j.status} | TransferStatus: ${j.transfer_status}`);
        console.log(`    LineItems:`, JSON.stringify(j.line_items || j.lineItems || []));
    });

    // 4. Purchase Order Items
    const { data: poItems, error: poErr } = await supabase
        .from('purchase_order_items')
        .select('*')
        .or('product_name.ilike.%Buna%,sku.eq.PA0001');
    console.log(`\n[4] PURCHASE ORDER ITEMS TABLE (${poItems?.length || 0} records):`);
    (poItems || []).forEach(pi => {
        console.log(`  - ID: ${pi.id} | PO ID: ${pi.po_id} | Qty: ${pi.quantity} | Received: ${pi.received_quantity} | UnitPrice: ${pi.unit_price}`);
    });

    console.log("\n=========================================");
}

traceBunaTea();
