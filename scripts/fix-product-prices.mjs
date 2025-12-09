/**
 * Fix Product Prices
 * 
 * Updates products with price = 0 to have realistic prices based on category
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let supabaseUrl, supabaseServiceKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Price ranges by category (in ETB)
const CATEGORY_PRICES = {
    'Dairy & Eggs': { min: 50, max: 200 },
    'Dairy': { min: 50, max: 200 },
    'Fresh': { min: 30, max: 150 },
    'Frozen Foods': { min: 80, max: 250 },
    'Frozen': { min: 80, max: 250 },
    'Bakery': { min: 25, max: 100 },
    'Pantry Staples': { min: 40, max: 180 },
    'Pantry': { min: 40, max: 180 },
    'Beverages': { min: 20, max: 120 },
    'Snacks & Sweets': { min: 15, max: 80 },
    'Snacks': { min: 15, max: 80 },
    'Health & Wellness': { min: 100, max: 500 },
    'Personal Care': { min: 50, max: 300 },
    'Household': { min: 60, max: 250 },
    'Electronics': { min: 500, max: 5000 },
    'Meat & Seafood': { min: 150, max: 600 },
    'Fresh Produce': { min: 20, max: 100 },
    'default': { min: 30, max: 150 }
};

function getRandomPrice(category) {
    const range = CATEGORY_PRICES[category] || CATEGORY_PRICES['default'];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

async function fixProductPrices() {
    console.log('\n🔧 FIXING PRODUCT PRICES\n');
    console.log('═'.repeat(60));

    // Get products with price = 0 or null
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .or('price.eq.0,price.is.null');

    if (error) {
        console.error('Error fetching products:', error.message);
        return;
    }

    console.log(`\n📦 Found ${products.length} products with price = 0 or NULL\n`);

    if (products.length === 0) {
        console.log('✅ All products have valid prices!');
        return;
    }

    let updated = 0;
    let failed = 0;

    for (const product of products) {
        const newPrice = getRandomPrice(product.category);
        const costPrice = Math.floor(newPrice * 0.6); // 60% cost price

        console.log(`   Updating "${product.name}":`);
        console.log(`      Category: ${product.category || 'unknown'}`);
        console.log(`      New Price: ETB ${newPrice}`);
        console.log(`      Cost Price: ETB ${costPrice}`);

        const { error: updateError } = await supabase
            .from('products')
            .update({
                price: newPrice,
                costPrice: costPrice
            })
            .eq('id', product.id);

        if (updateError) {
            console.log(`      ❌ Failed: ${updateError.message}`);
            failed++;
        } else {
            console.log(`      ✅ Updated!`);
            updated++;
        }
        console.log('');
    }

    console.log('═'.repeat(60));
    console.log(`\n🎉 COMPLETE!`);
    console.log(`   ✅ Updated: ${updated} products`);
    if (failed > 0) console.log(`   ❌ Failed: ${failed} products`);

    // Recalculate totals
    console.log('\n📊 Recalculating Network Value...\n');

    const { data: allProducts } = await supabase.from('products').select('price, stock, site_id');
    const { data: sites } = await supabase.from('sites').select('id, name, type');

    let networkValue = 0;
    for (const site of sites) {
        if (site.type === 'Administration' || site.type === 'Administrative') continue;

        const siteProducts = allProducts.filter(p => p.site_id === site.id);
        const siteValue = siteProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

        console.log(`   ${site.name}: ETB ${siteValue.toLocaleString()}`);
        networkValue += siteValue;
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`   💰 NEW NETWORK VALUE: ETB ${networkValue.toLocaleString()}`);
    console.log('\n💡 Refresh your browser to see the updated values!\n');
}

fixProductPrices().catch(console.error);
