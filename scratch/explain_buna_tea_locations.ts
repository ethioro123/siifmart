import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== TRACING ORIGIN OF ALL 6 BUNA TEA LOCATIONS ===");

    const { data: sites } = await supabase.from('sites').select('*');
    const siteMap = new Map((sites || []).map(s => [s.id, s]));

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .or('sku.eq.PA0001,name.ilike.%Buna%');

    for (const p of products || []) {
        const s = siteMap.get(p.site_id);
        console.log(`\nLocation: "${s?.name || p.site_id}" (${s?.type || 'N/A'})`);
        console.log(`  - Product ID: ${p.id}`);
        console.log(`  - SKU: ${p.sku} | Stock: ${p.stock} | Shelf: ${p.location || 'N/A'}`);
        console.log(`  - CreatedAt: ${p.created_at || (p as any).createdAt} | UpdatedAt: ${p.updated_at}`);

        // Check stock movements for this product ID or site
        const { data: movements } = await supabase
            .from('stock_movements')
            .select('*')
            .eq('product_id', p.id);

        console.log(`  - Movement Logs Count: ${movements?.length || 0}`);
        (movements || []).forEach(m => {
            console.log(`      [${m.movement_date}] ${m.type} ${m.quantity} | Reason: ${m.reason} | User: ${m.performed_by}`);
        });
    }

    console.log("\n=================================================");
}

main();
