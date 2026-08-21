import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== SEARCHING FOR ALL PRODUCTS MATCHING PA-0001 OR HYPHENS ACROSS ALL SITES ===");

    const { data: hyphenated, error } = await supabase
        .from('products')
        .select('*')
        .or('sku.ilike.%PA-0001%,sku.ilike.%-%');

    console.log(`Found ${hyphenated?.length || 0} hyphenated product records:`);
    if (hyphenated) {
        for (const p of hyphenated) {
            console.log(`- ID: ${p.id} | Site: ${p.site_id} | Name: ${p.name} | SKU: ${p.sku} | Stock: ${p.stock} | Price: ${p.price}`);
        }
    }

    // Delete any PA-0001 records with 0 stock
    const paHyphen = (hyphenated || []).filter(p => p.sku.toUpperCase().includes('PA-0001'));
    if (paHyphen.length > 0) {
        const idsToDelete = paHyphen.filter(p => p.stock === 0).map(p => p.id);
        if (idsToDelete.length > 0) {
            const { error: delErr } = await supabase.from('products').delete().in('id', idsToDelete);
            console.log(`Deleted ${idsToDelete.length} 0-stock PA-0001 products:`, delErr ? delErr.message : "Success");
        }
        // Normalize any remaining PA-0001 to PA0001
        const remainingPaHyphen = paHyphen.filter(p => p.stock > 0);
        for (const p of remainingPaHyphen) {
            const clean = p.sku.replace(/-/g, '').toUpperCase();
            await supabase.from('products').update({ sku: clean }).eq('id', p.id);
            console.log(`Normalized SKU for active stock product ${p.id}: ${p.sku} -> ${clean}`);
        }
    }

    // Now normalize ALL remaining products with hyphens in SKU if any
    const { data: allHyphenated } = await supabase.from('products').select('id, sku, stock').like('sku', '%-%');
    if (allHyphenated && allHyphenated.length > 0) {
        console.log(`Normalizing ${allHyphenated.length} additional hyphenated SKUs...`);
        for (const p of allHyphenated) {
            const clean = p.sku.replace(/-/g, '').toUpperCase();
            await supabase.from('products').update({ sku: clean }).eq('id', p.id);
            console.log(`Normalized ${p.sku} -> ${clean}`);
        }
    } else {
        console.log("No additional hyphenated SKUs found in products table.");
    }
}

main();
