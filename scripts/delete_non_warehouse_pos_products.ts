import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("🚀 Starting database cleanup...");

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    if (authErr) {
        console.error("❌ Sign in failed:", authErr);
        return;
    }
    console.log("Logged in successfully as:", authData.user?.email);

    // 1. Fetch sites to classify them
    const { data: sites, error: sitesErr } = await supabase.from('sites').select('*');
    if (sitesErr || !sites) {
        console.error("❌ Error fetching sites:", sitesErr);
        return;
    }

    const warehouseSiteIds = sites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center').map(s => s.id);
    const storeSiteIds = sites.filter(s => s.type === 'Store').map(s => s.id);

    console.log(`Warehouse/Distribution Center Site IDs:`, warehouseSiteIds);
    console.log(`Store (POS) Site IDs:`, storeSiteIds);

    // 2. Fetch all products
    const { data: allProducts, error: prodErr } = await supabase.from('products').select('*');
    if (prodErr || !allProducts) {
        console.error("❌ Error fetching products:", prodErr);
        return;
    }

    const warehouseSKUs = new Set(allProducts.filter(p => warehouseSiteIds.includes(p.site_id)).map(p => p.sku));
    
    // Identify target products: products assigned to Store sites whose SKUs are not present in any Warehouse/Distribution Center
    const targetProducts = allProducts.filter(p => storeSiteIds.includes(p.site_id) && !warehouseSKUs.has(p.sku));

    console.log(`\nFound ${targetProducts.length} POS products whose SKU is NOT in any warehouse:`);
    for (const p of targetProducts) {
        const site = sites.find(s => s.id === p.site_id);
        console.log(`- "${p.name}" (SKU: ${p.sku}) at Store "${site?.name}" (ID: ${p.id})`);
    }

    if (targetProducts.length === 0) {
        console.log("\n✅ No products to delete. Database is already clean!");
        return;
    }

    console.log("\n=== Executing safe deletion sequence ===");

    let successCount = 0;
    for (const product of targetProducts) {
        const pid = product.id;
        console.log(`\nProcessing: "${product.name}" (ID: ${pid})`);

        // A. Set product_id to NULL in referencing sale_items
        const { error: saleErr } = await supabase
            .from('sale_items')
            .update({ product_id: null })
            .eq('product_id', pid);
        if (saleErr) {
            console.error(`  ⚠️ Error updating sale_items for product ${pid}:`, saleErr);
        } else {
            console.log(`  ✓ Updated referencing sale_items to NULL.`);
        }

        // B. Set product_id to NULL in referencing stock_movements
        const { error: smErr } = await supabase
            .from('stock_movements')
            .update({ product_id: null })
            .eq('product_id', pid);
        if (smErr) {
            console.error(`  ⚠️ Error updating stock_movements for product ${pid}:`, smErr);
        } else {
            console.log(`  ✓ Updated referencing stock_movements to NULL.`);
        }

        // C. Delete the product row
        const { error: delErr } = await supabase
            .from('products')
            .delete()
            .eq('id', pid);
        if (delErr) {
            console.error(`  ❌ Failed to delete product ${pid}:`, delErr);
        } else {
            console.log(`  ✓ Successfully deleted product.`);
            successCount++;
        }
    }

    console.log(`\n🎉 Cleanup finished! Successfully deleted ${successCount} of ${targetProducts.length} target products.`);
}

main();
