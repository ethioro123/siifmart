import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function deepDiveMovements() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=========================================================");
    console.log("=== DEEP DIVE: ALL MOVEMENTS IN DATABASE AND SOURCES ===");
    console.log("=========================================================\n");

    // Fetch all sites
    const { data: sites } = await supabase.from('sites').select('*');
    const siteMap = new Map((sites || []).map(s => [s.id, s.name]));

    // Fetch all stock movements
    const { data: allMovements } = await supabase
        .from('stock_movements')
        .select('*')
        .order('movement_date', { ascending: true });

    console.log(`TOTAL STOCK MOVEMENTS IN DB: ${allMovements?.length || 0}\n`);

    // Group movements by product_name or product_id or SKU
    const bunaMovements = (allMovements || []).filter(m => {
        const str = JSON.stringify(m).toLowerCase();
        return str.includes('buna') || str.includes('pa0001') || str.includes('pa-0001');
    });

    console.log(`=== BUNA TEA MOVEMENTS (${bunaMovements.length} total) ===`);
    bunaMovements.forEach((m, idx) => {
        const siteName = siteMap.get(m.site_id) || m.site_id || 'NO_SITE';
        console.log(`[${idx + 1}] ID: ${m.id}`);
        console.log(`     Date: ${m.movement_date}`);
        console.log(`     Site: ${siteName} (${m.site_id})`);
        console.log(`     Type: ${m.type} | Qty: ${m.quantity} | ProdID: ${m.product_id} | ProdName: "${m.product_name}"`);
        console.log(`     Reason: "${m.reason}" | User: "${m.performed_by}"`);
        console.log(`     Raw JSON:`, JSON.stringify(m));
        console.log("---------------------------------------------------------");
    });

    // Also let's check ALL WMS Jobs line items to see if jobs exist that didn't create a movement log yet or created a movement log under a different name!
    const { data: jobs } = await supabase.from('wms_jobs').select('*').order('created_at', { ascending: true });
    console.log(`\n=== ALL WMS JOBS IN DB (${jobs?.length || 0} total) ===`);
    (jobs || []).forEach(j => {
        const str = JSON.stringify(j).toLowerCase();
        if (str.includes('buna') || str.includes('pa0001')) {
            const fromName = siteMap.get(j.source_site_id || j.from_site_id) || j.source_site_id;
            const toName = siteMap.get(j.dest_site_id || j.to_site_id) || j.dest_site_id;
            console.log(`- Job ${j.job_number} (${j.type}) | Status: ${j.status} | TransferStatus: ${j.transfer_status}`);
            console.log(`  From: "${fromName}" -> To: "${toName}" | CompletedBy: ${j.completed_by} at ${j.completed_at}`);
            console.log(`  LineItems:`, JSON.stringify(j.line_items || j.lineItems));
        }
    });

    console.log("\n=========================================================");
}

deepDiveMovements();
