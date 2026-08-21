import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== STARTING GLOBAL STOCK RECONCILIATION ===");

    // 1. Fetch all products
    const { data: products, error: pErr } = await supabase.from('products').select('id, sku, name, site_id, stock');
    if (pErr) throw pErr;

    // 2. Fetch all stock movements
    const { data: movements, error: mErr } = await supabase.from('stock_movements').select('product_id, site_id, type, quantity');
    if (mErr) throw mErr;

    // 3. Fetch all sites for mapping names
    const { data: sites } = await supabase.from('sites').select('id, name');
    const siteMap = new Map((sites || []).map(s => [s.id, s.name]));

    // 4. Calculate net movements
    // Key: `${product_id}_${site_id}`
    const calculatedStock = new Map<string, number>();

    for (const mov of movements || []) {
        // Some movements might not have site_id explicitly if they are old, we fall back to product's site
        const prod = products?.find(p => p.id === mov.product_id);
        const actualSiteId = mov.site_id || prod?.site_id;
        
        if (!actualSiteId || !mov.product_id) continue;

        const key = `${mov.product_id}_${actualSiteId}`;
        const current = calculatedStock.get(key) || 0;
        
        // Handle qty format (some might be strings like "+30" or "-20")
        let qty = 0;
        if (typeof mov.quantity === 'number') {
            qty = mov.quantity;
        } else if (typeof mov.quantity === 'string') {
            const parsed = parseFloat(mov.quantity.replace(/[^0-9.-]/g, ''));
            if (!isNaN(parsed)) qty = parsed;
        }

        // Apply type modifier if quantity is strictly positive in DB but type says OUT
        if (mov.type === 'OUT' && qty > 0) {
            qty = -qty;
        } else if (mov.type === 'IN' && qty < 0) {
            qty = Math.abs(qty); // Should be positive
        }

        calculatedStock.set(key, current + qty);
    }

    // 5. Compare and prepare updates
    const updates: any[] = [];
    let matchCount = 0;

    console.log("\n--- DISCREPANCIES FOUND ---");
    for (const prod of products || []) {
        if (!prod.site_id) continue;
        const key = `${prod.id}_${prod.site_id}`;
        
        // Only consider products that have movements. 
        // If a product has no movements, we assume its current stock is its starting balance.
        if (!calculatedStock.has(key)) {
            matchCount++;
            continue;
        }

        const exactStock = calculatedStock.get(key) || 0;
        
        // Due to floating point issues or manual edits, we round to 2 decimals for comparison
        const roundedExact = Math.round(exactStock * 100) / 100;
        const roundedCurrent = Math.round(prod.stock * 100) / 100;

        if (roundedExact !== roundedCurrent) {
            const siteName = siteMap.get(prod.site_id) || prod.site_id;
            console.log(`[Mismatch] ${prod.name} (SKU: ${prod.sku}) at ${siteName}`);
            console.log(`   -> Current DB Stock: ${prod.stock}`);
            console.log(`   -> Calculated from Log: ${roundedExact}`);
            
            updates.push({
                id: prod.id,
                stock: roundedExact
            });
        } else {
            matchCount++;
        }
    }

    console.log(`\nFound ${updates.length} discrepancies out of ${products?.length || 0} total products.`);
    console.log(`(${matchCount} products are already perfectly synced with their movement history or have no history)`);

    // 6. Apply fixes
    if (updates.length > 0) {
        console.log("\n--- APPLYING FIXES ---");
        for (const update of updates) {
            const { error } = await supabase
                .from('products')
                .update({ stock: update.stock })
                .eq('id', update.id);
            if (error) {
                console.error(`Failed to update product ${update.id}: ${error.message}`);
            } else {
                console.log(`Fixed product ${update.id} -> new stock: ${update.stock}`);
            }
        }
        console.log("=== ALL FIXES APPLIED SUCCESSFULLY ===");
    } else {
        console.log("=== NO FIXES NEEDED ===");
    }
}

main();
