/**
 * Check Product Distribution and Value Consistency
 * 
 * This script analyzes product values across all sites to identify discrepancies
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

async function checkInventoryValues() {
    console.log('\n🔍 CHECKING INVENTORY VALUES ACROSS ALL SITES\n');
    console.log('═'.repeat(70));

    // Get all sites
    const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*');

    if (sitesError) {
        console.error('Error fetching sites:', sitesError.message);
        return;
    }

    // Get all products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

    if (productsError) {
        console.error('Error fetching products:', productsError.message);
        return;
    }

    console.log(`\n📊 Total Sites: ${sites.length}`);
    console.log(`📦 Total Products: ${products.length}\n`);

    let grandTotalValue = 0;
    let grandTotalItems = 0;
    let grandTotalProducts = 0;

    const siteData = [];

    // Analyze each site
    for (const site of sites) {
        const siteProducts = products.filter(p => p.site_id === site.id);

        const totalValue = siteProducts.reduce((sum, p) => {
            const price = p.price || 0;
            const stock = p.stock || 0;
            return sum + (price * stock);
        }, 0);

        const totalItems = siteProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

        siteData.push({
            name: site.name,
            type: site.type,
            id: site.id,
            productCount: siteProducts.length,
            totalItems,
            totalValue
        });

        // Only count non-HQ/Administrative sites
        if (site.type !== 'HQ' && site.type !== 'Administrative' &&
            !site.name?.toLowerCase().includes('hq')) {
            grandTotalValue += totalValue;
            grandTotalItems += totalItems;
            grandTotalProducts += siteProducts.length;
        }
    }

    // Sort by value descending
    siteData.sort((a, b) => b.totalValue - a.totalValue);

    console.log('📍 SITE-BY-SITE BREAKDOWN:\n');
    console.log('─'.repeat(70));

    for (const site of siteData) {
        const isHQ = site.type === 'HQ' || site.type === 'Administrative' ||
            site.name?.toLowerCase().includes('hq');
        const marker = isHQ ? '🏢 [EXCLUDED]' :
            (site.type === 'Warehouse' || site.type === 'Distribution Center' ? '📦' : '🏪');

        console.log(`${marker} ${site.name}`);
        console.log(`   Type: ${site.type}`);
        console.log(`   Products: ${site.productCount}`);
        console.log(`   Total Items: ${site.totalItems.toLocaleString()}`);
        console.log(`   Total Value: ETB ${site.totalValue.toLocaleString()}`);
        console.log('─'.repeat(70));
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📈 NETWORK TOTALS (Excluding HQ/Administrative):');
    console.log('═'.repeat(70));
    console.log(`   Total Products: ${grandTotalProducts}`);
    console.log(`   Total Items: ${grandTotalItems.toLocaleString()}`);
    console.log(`   NETWORK VALUE: ETB ${grandTotalValue.toLocaleString()}`);
    console.log('═'.repeat(70));

    // Check for products with no site or orphaned site_id
    const orphanedProducts = products.filter(p => {
        if (!p.site_id) return true;
        return !sites.find(s => s.id === p.site_id);
    });

    if (orphanedProducts.length > 0) {
        console.log('\n⚠️  ORPHANED PRODUCTS (no valid site_id):');
        orphanedProducts.forEach(p => {
            console.log(`   - ${p.name} (SKU: ${p.sku}) - site_id: ${p.site_id || 'NULL'}`);
        });

        const orphanValue = orphanedProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
        console.log(`\n   ⚠️  Orphaned Products Value: ETB ${orphanValue.toLocaleString()}`);
    }

    // Check for products with siteId vs site_id inconsistency
    const productsWithSiteId = products.filter(p => p.siteId && p.siteId !== p.site_id);
    if (productsWithSiteId.length > 0) {
        console.log('\n⚠️  PRODUCTS WITH MISMATCHED siteId vs site_id:');
        productsWithSiteId.slice(0, 5).forEach(p => {
            console.log(`   - ${p.name}: siteId=${p.siteId}, site_id=${p.site_id}`);
        });
        if (productsWithSiteId.length > 5) {
            console.log(`   ... and ${productsWithSiteId.length - 5} more`);
        }
    }

    console.log('\n');
}

checkInventoryValues().catch(console.error);
