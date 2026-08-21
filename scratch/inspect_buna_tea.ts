import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== PRODUCTS MATCHING 'PA0001' OR 'PA-0001' ===");
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .or('sku.eq.PA0001,sku.eq.PA-0001,name.ilike.%Buna%');

    console.log(JSON.stringify(products, null, 2));

    console.log("\n=== STOCK MOVEMENTS FOR BUNA TEA ===");
    const productIds = products?.map(p => p.id) || [];
    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .or(`product_id.in.(${productIds.join(',')}),product_name.ilike.%Buna%`);

    console.log(JSON.stringify(movements, null, 2));

    console.log("\n=== ALL PRODUCTS WITH HYPHENS IN SKU IN DATABASE ===");
    const { data: hyphenatedProducts } = await supabase
        .from('products')
        .select('id, sku, name, site_id, location, stock')
        .like('sku', '%-%');

    console.log(`Found ${hyphenatedProducts?.length || 0} products with hyphens in SKU:`);
    console.log(JSON.stringify(hyphenatedProducts, null, 2));
}

main();
