import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== INSPECTING ALL SITES IN DB ===");
    const { data: sites } = await supabase.from('sites').select('*');
    (sites || []).forEach(s => {
        console.log(`- ID: ${s.id} | Name: "${s.name}" | Type: ${s.type} | Code: ${s.code}`);
    });

    console.log("\n=== INSPECTING ALL PRODUCTS FOR BUNA TEA (PA0001) ===");
    const { data: products } = await supabase.from('products').select('*').eq('sku', 'PA0001');
    const siteMap = new Map((sites || []).map(s => [s.id, s]));

    (products || []).forEach(p => {
        const site = siteMap.get(p.site_id);
        console.log(`- Product ID: ${p.id}`);
        console.log(`  Site: "${site?.name || p.site_id}" (Type: ${site?.type || 'N/A'}, ID: ${p.site_id})`);
        console.log(`  Stock: ${p.stock} | Unit: ${p.unit} | Size: ${p.size} | Location/Shelf: ${p.location || 'N/A'}`);
    });

    console.log("\n=== INSPECTING ALL STOCK MOVEMENTS FOR BUNA TEA ===");
    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .or('product_name.ilike.%Buna%,product_id.in.(' + (products || []).map(p => `"${p.id}"`).join(',') + ')');

    (movements || []).forEach(m => {
        const site = siteMap.get(m.site_id);
        console.log(`- [${m.movement_date}] Type: ${m.type} | Qty: ${m.quantity} | Site: "${site?.name || m.site_id}" (${site?.type}) | Reason: ${m.reason} | User: ${m.performed_by}`);
    });

    console.log("\n=== INSPECTING ALL WMS JOBS FOR BUNA TEA ===");
    const { data: jobs } = await supabase.from('wms_jobs').select('*');
    const bunaJobs = (jobs || []).filter(j => {
        const str = JSON.stringify(j);
        return str.includes('PA0001') || str.toLowerCase().includes('buna');
    });

    bunaJobs.forEach(j => {
        const fromSite = siteMap.get(j.from_site_id || (j as any).fromSiteId);
        const toSite = siteMap.get(j.to_site_id || (j as any).toSiteId);
        console.log(`- Job ${j.job_number} (${j.type}) | Status: ${j.status} | From: "${fromSite?.name || j.from_site_id}" (${fromSite?.type}) -> To: "${toSite?.name || j.to_site_id}" (${toSite?.type})`);
        console.log(`  LineItems:`, JSON.stringify(j.line_items || j.lineItems));
    });
}

main();
