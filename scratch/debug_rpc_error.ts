import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth active:", !!authRes.data.session);

    // Fetch a product from DB to test valid ID
    const { data: prods } = await supabase.from('products').select('*').limit(1);
    if (!prods || prods.length === 0) return;
    const product = prods[0];

    console.log("Testing with product ID:", product.id, "site_id:", product.site_id);

    // Test with valid site_id UUID
    const { data: d1, error: e1 } = await supabase.rpc('pos_decrement_stock', {
        p_product_id: product.id,
        p_quantity: 0, // 0 so we don't actually deduct stock in test
        p_site_id: product.site_id || '0e27440b-d6a3-40dc-b140-d7dbd5935de5',
        p_product_name: product.name,
        p_reason: 'Test decrement',
        p_performed_by: 'Test',
        p_sale_date: new Date().toISOString()
    });

    console.log("Result 1 (valid site_id):", { d1, e1 });
}

main().catch(console.error);
