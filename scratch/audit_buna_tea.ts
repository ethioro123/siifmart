import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function calculateWarehouseAndStores() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=================================================");
    console.log("=== BUNA TEA DETAILED WAREHOUSE & STORE AUDIT ===");
    console.log("=================================================\n");

    // 1. Fetch all sites
    const { data: sites } = await supabase.from('sites').select('*');
    const siteMap = new Map((sites || []).map(s => [s.id, s.name]));

    // 2. Fetch all products for PA0001
    const { data: products } = await supabase.from('products').select('*').eq('sku', 'PA0001');

    console.log("CURRENT PRODUCTS IN DB:");
    (products || []).forEach(p => {
        const siteName = siteMap.get(p.site_id) || p.site_id || 'Unknown Site';
        console.log(`  - Store/Site: ${siteName} (${p.site_id})`);
        console.log(`    Stock: ${p.stock} | Unit: ${p.unit} | Size: ${p.size} | Location: ${p.location || 'N/A'}`);
    });

    // 3. Fetch all Stock Movements for PA0001
    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .or('product_name.ilike.%Buna%,product_id.in.(' + (products || []).map(p => `"${p.id}"`).join(',') + ')');

    console.log("\nSTOCK MOVEMENTS LOG:");
    (movements || []).forEach(m => {
        const siteName = siteMap.get(m.site_id) || m.site_id;
        console.log(`  - [${m.movement_date}] ${m.type} | Qty: ${m.quantity} | Site: ${siteName} | PerformedBy: ${m.performed_by} | Reason: ${m.reason}`);
    });

    // 4. Fetch Transfer Jobs for PA0001
    const { data: jobs } = await supabase.from('wms_jobs').select('*');
    const transferJobs = (jobs || []).filter(j => {
        const str = JSON.stringify(j);
        return str.includes('PA0001') || str.toLowerCase().includes('buna');
    });

    console.log("\nWMS JOBS FOR BUNA TEA:");
    transferJobs.forEach(j => {
        const fromSite = siteMap.get(j.from_site_id) || j.from_site_id;
        const toSite = siteMap.get(j.to_site_id) || j.to_site_id;
        console.log(`  - Job ${j.job_number} (${j.type}) | Status: ${j.status} | TransferStatus: ${j.transfer_status} | From: ${fromSite} -> To: ${toSite}`);
        const items = j.line_items || j.lineItems || [];
        (items || []).forEach((it: any) => {
            if (it.sku === 'PA0001' || (it.name && it.name.includes('Buna'))) {
                console.log(`    Item: ${it.name} | Expected: ${it.expectedQty} | Received: ${it.receivedQty || it.received_qty || 0} | Picked: ${it.pickedQty || 0}`);
            }
        });
    });

    console.log("\n=================================================");
}

calculateWarehouseAndStores();
