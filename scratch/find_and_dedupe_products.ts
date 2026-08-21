import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function findDuplicateProducts() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("==================================================");
    console.log("=== CHECKING FOR DUPLICATE PRODUCTS (SKU + SITE) ===");
    console.log("==================================================\n");

    const { data: products, error } = await supabase.from('products').select('*');
    if (error) {
        console.error("Error:", error);
        return;
    }

    const { data: sites } = await supabase.from('sites').select('*');
    const siteMap = new Map((sites || []).map(s => [s.id, s.name]));

    // Map: `${sku}_${site_id}` -> product[]
    const map = new Map<string, any[]>();

    for (const p of products || []) {
        if (!p.sku || !p.site_id) continue;
        const key = `${p.sku.toUpperCase().trim()}_${p.site_id}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
    }

    let dupeCount = 0;
    const idsToDelete: string[] = [];

    map.forEach((prods, key) => {
        if (prods.length > 1) {
            dupeCount++;
            const siteName = siteMap.get(prods[0].site_id) || prods[0].site_id;
            console.log(`DUPLICATE FOUND for SKU "${prods[0].sku}" at "${siteName}" (${prods.length} rows):`);
            prods.forEach((p, idx) => {
                console.log(`  [${idx}] ID: ${p.id} | Name: "${p.name}" | Stock: ${p.stock} | Updated: ${p.updated_at || p.created_at}`);
            });

            // Keep the most recently updated record (or highest stock), delete the rest
            // Sort by updated_at descending
            prods.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
            
            const keeper = prods[0];
            const trash = prods.slice(1);
            console.log(`  --> KEEPING ID: ${keeper.id} (Stock: ${keeper.stock})`);
            trash.forEach(t => {
                console.log(`  --> DELETING DUPLICATE ID: ${t.id}`);
                idsToDelete.push(t.id);
            });
            console.log("");
        }
    });

    console.log(`Found ${dupeCount} duplicate SKU+site groups, total ${idsToDelete.length} extra rows to remove.`);

    if (idsToDelete.length > 0) {
        console.log("Removing duplicate product rows...");
        for (const id of idsToDelete) {
            const { error: delErr } = await supabase.from('products').delete().eq('id', id);
            if (delErr) {
                console.error(`Failed to delete product ${id}:`, delErr.message);
            } else {
                console.log(`Successfully deleted duplicate product ${id}`);
            }
        }
        console.log("=== DUPLICATE CLEANUP COMPLETE ===");
    }
}

findDuplicateProducts();
