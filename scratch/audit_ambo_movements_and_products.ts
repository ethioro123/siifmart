import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const amboSiteId = 'b2293359-9b3b-4468-9c2f-8a6e288791e3';

    console.log("=== FULL AUDIT OF AMBO SITE PRODUCTS & MOVEMENTS ===");

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', amboSiteId);

    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('site_id', amboSiteId);

    console.log(`AMBO Products Count: ${products?.length}`);
    console.log(`AMBO Movements Count: ${movements?.length}`);

    (products || []).forEach(p => {
        const prodMovements = (movements || []).filter(m => m.product_id === p.id || m.product_name === p.name);
        let calculated = 0;
        prodMovements.forEach(m => {
            let q = typeof m.quantity === 'number' ? m.quantity : parseFloat(String(m.quantity || '0'));
            if (m.type === 'OUT' && q > 0) q = -q;
            calculated += q;
        });

        console.log(`\nProduct: "${p.name}" (SKU: ${p.sku})`);
        console.log(`  - DB Stock: ${p.stock} ${p.unit || ''} | Physical Size: ${p.size || 'N/A'}`);
        console.log(`  - Movement Count: ${prodMovements.length} | Calc from Move: ${calculated}`);
        if (prodMovements.length > 0) {
            prodMovements.forEach(m => {
                console.log(`      [${m.movement_date}] ${m.type} ${m.quantity} (${m.reason})`);
            });
        }
    });

    console.log("\n=== AMBO AUDIT COMPLETE ===");
}

main();
