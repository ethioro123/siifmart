/**
 * Fix SIIFMART HQ Site Type
 * 
 * This script:
 * 1. Finds the SIIFMART HQ site and updates its type to 'HQ'
 * 2. Deletes any products incorrectly assigned to HQ (HQ is administrative, no inventory)
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixHQSite() {
    console.log('\n🔍 STEP 1: Finding SIIFMART HQ site...\n');

    // Find HQ sites by name (could be mistyped)
    const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('*');

    if (sitesError) {
        console.error('❌ Error fetching sites:', sitesError.message);
        return;
    }

    console.log(`📊 Found ${sites.length} total sites:\n`);
    sites.forEach(site => {
        const isHQ = site.type === 'HQ' ||
            site.name?.toLowerCase().includes('hq') ||
            site.name?.toLowerCase().includes('headquarters');
        const marker = isHQ ? '🏢 [HQ]' : (site.type === 'Warehouse' ? '📦' : '🏪');
        console.log(`   ${marker} ${site.name} (ID: ${site.id}) - Type: "${site.type}"`);
    });

    // Find HQ sites that need fixing
    const hqSites = sites.filter(s =>
        (s.name?.toLowerCase().includes('hq') ||
            s.name?.toLowerCase().includes('headquarters') ||
            s.name?.toLowerCase().includes('siifmart hq')) &&
        s.type !== 'HQ'
    );

    if (hqSites.length === 0) {
        // Check if there's already a correctly typed HQ
        const correctHQ = sites.find(s => s.type === 'HQ');
        if (correctHQ) {
            console.log(`\n✅ HQ site already correctly typed: "${correctHQ.name}" (type: HQ)`);
        } else {
            console.log('\n⚠️  No HQ site found that needs fixing.');
        }
    } else {
        console.log(`\n🔧 STEP 2: Fixing ${hqSites.length} HQ site(s) with wrong type...\n`);

        for (const site of hqSites) {
            console.log(`   Updating "${site.name}" type from "${site.type}" to "HQ"...`);

            const { error: updateError } = await supabase
                .from('sites')
                .update({ type: 'HQ' })
                .eq('id', site.id);

            if (updateError) {
                console.error(`   ❌ Failed to update: ${updateError.message}`);
            } else {
                console.log(`   ✅ Successfully updated "${site.name}" to type: HQ`);
            }
        }
    }

    // Now find all HQ site IDs (by type or name)
    const allHQSiteIds = sites
        .filter(s =>
            s.type === 'HQ' ||
            s.name?.toLowerCase().includes('hq') ||
            s.name?.toLowerCase().includes('headquarters')
        )
        .map(s => s.id);

    if (allHQSiteIds.length === 0) {
        console.log('\n⚠️  No HQ sites found to check for products.');
        return;
    }

    console.log(`\n🔍 STEP 3: Checking for products incorrectly assigned to HQ sites...\n`);

    // Find products assigned to HQ
    const { data: hqProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, site_id')
        .in('site_id', allHQSiteIds);

    if (productsError) {
        console.error('❌ Error fetching products:', productsError.message);
        return;
    }

    if (hqProducts && hqProducts.length > 0) {
        console.log(`   ⚠️  Found ${hqProducts.length} products incorrectly assigned to HQ:\n`);
        hqProducts.forEach(p => {
            console.log(`      - ${p.name} (SKU: ${p.sku})`);
        });

        console.log(`\n🗑️  STEP 4: Deleting products from HQ (HQ should have no inventory)...\n`);

        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .in('site_id', allHQSiteIds);

        if (deleteError) {
            console.error(`   ❌ Failed to delete products: ${deleteError.message}`);
        } else {
            console.log(`   ✅ Successfully deleted ${hqProducts.length} products from HQ sites`);
        }
    } else {
        console.log('   ✅ No products found on HQ sites (correct!)');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 HQ SITE FIX COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\nSummary:');
    console.log('  • HQ sites now have type: "HQ"');
    console.log('  • Products removed from HQ (HQ is administrative only)');
    console.log('  • Network Inventory will no longer show HQ');
    console.log('\n💡 Refresh your browser to see the changes.\n');
}

fixHQSite().catch(console.error);
