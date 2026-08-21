import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== FIXING BUNA TEA & HYPHENATED SKUS ===");

    // 1. Delete 0-stock hyphenated ghost product PA-0001 (id: 2794717a-f4f6-47cb-a71c-06dc1d82c0aa)
    const { error: delHyphenErr } = await supabase
        .from('products')
        .delete()
        .eq('id', '2794717a-f4f6-47cb-a71c-06dc1d82c0aa');
    console.log("Deleted PA-0001 product:", delHyphenErr ? delHyphenErr.message : "Success");

    // 2. Consolidate Buna Tea details from 0-stock placeholder onto active stock record
    // Active stock record: 6431dfc1-7064-4809-a851-6775bec14356
    // Placeholder record: 7b70bbdc-0aab-4238-a81a-c3f720385332
    const { error: updateActiveErr } = await supabase
        .from('products')
        .update({
            price: 500,
            cost_price: 360,
            barcode: '546767863467',
            barcodes: ['546767863467', '5687635875678', '4543543543']
        })
        .eq('id', '6431dfc1-7064-4809-a851-6775bec14356');
    console.log("Updated active Buna Tea record with price & barcode:", updateActiveErr ? updateActiveErr.message : "Success");

    // 3. Delete 0-stock placeholder record 7b70bbdc-0aab-4238-a81a-c3f720385332
    const { error: delPlaceholderErr } = await supabase
        .from('products')
        .delete()
        .eq('id', '7b70bbdc-0aab-4238-a81a-c3f720385332');
    console.log("Deleted 0-stock placeholder Buna Tea record:", delPlaceholderErr ? delPlaceholderErr.message : "Success");

    // 4. Update any remaining products in DB that have hyphens in SKU to clean unhyphenated SKU
    const { data: hyphenProds } = await supabase
        .from('products')
        .select('id, sku')
        .like('sku', '%-%');

    if (hyphenProds && hyphenProds.length > 0) {
        for (const hp of hyphenProds) {
            const cleanSku = hp.sku.replace(/-/g, '').toUpperCase();
            await supabase.from('products').update({ sku: cleanSku }).eq('id', hp.id);
            console.log(`Cleaned SKU: ${hp.sku} -> ${cleanSku}`);
        }
    } else {
        console.log("No other hyphenated SKUs found in database.");
    }

    console.log("=== BUNA TEA DB CLEANUP COMPLETE ===");
}

main();
