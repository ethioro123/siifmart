import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function auditAmbo() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=========================================");
    console.log("=== AUDITING AMBO SITE DATA & LOGS ===");
    console.log("=========================================\n");

    const amboSiteId = 'b2293359-9b3b-4468-9c2f-8a6e288791e3';

    // 1. Fetch products for AMBO site
    const { data: amboProducts } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', amboSiteId);

    console.log(`[1] AMBO PRODUCTS IN 'products' TABLE (${amboProducts?.length || 0} items):`);
    (amboProducts || []).forEach(p => {
        console.log(`  - SKU: ${p.sku} | Name: "${p.name}" | Stock: ${p.stock} | Unit: ${p.unit} | Size: ${p.size} | Loc: ${p.location}`);
    });

    // 2. Fetch stock movements for AMBO site
    const { data: amboMovements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('site_id', amboSiteId)
        .order('movement_date', { ascending: false });

    console.log(`\n[2] AMBO STOCK MOVEMENTS LOG (${amboMovements?.length || 0} entries):`);
    (amboMovements || []).forEach(m => {
        console.log(`  - [${m.movement_date}] ${m.type} | Qty: ${m.quantity} | ProdID: ${m.product_id} | ProdName: "${m.product_name}" | Reason: ${m.reason}`);
    });

    // 3. Check for products with same SKU across ALL sites to see how ProductDetailsModal aggregates
    console.log("\n[3] CROSS-SITE AGGREGATION CHECK:");
    const skus = Array.from(new Set((amboProducts || []).map(p => p.sku)));
    for (const sku of skus) {
        const { data: skuProducts } = await supabase.from('products').select('*').eq('sku', sku);
        console.log(`  - SKU: ${sku} exists in ${skuProducts?.length} sites:`);
        skuProducts?.forEach(sp => {
            console.log(`      SiteID: ${sp.site_id} | Stock: ${sp.stock} | Unit: ${sp.unit} | Size: ${sp.size}`);
        });
    }

    console.log("\n=========================================");
}

auditAmbo();
