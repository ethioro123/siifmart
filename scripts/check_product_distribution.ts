import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProductDistribution() {
    console.log('📊 Checking current product distribution across sites...\n');

    // Get all products and sites
    const { data: products } = await supabase
        .from('products')
        .select('sku, site_id, stock, name')
        .order('sku');

    const { data: sites } = await supabase
        .from('sites')
        .select('id, name, type');

    const siteMap = new Map(sites?.map(s => [s.id, s.name]) || []);
    const skuGroups = new Map<string, Array<{ site: string, stock: number, name: string }>>();

    products?.forEach(p => {
        if (!skuGroups.has(p.sku)) {
            skuGroups.set(p.sku, []);
        }
        skuGroups.get(p.sku)!.push({
            site: siteMap.get(p.site_id) || 'Unknown',
            stock: p.stock,
            name: p.name
        });
    });

    console.log(`Total unique SKUs: ${skuGroups.size}`);
    console.log(`Total product records: ${products?.length || 0}`);
    console.log(`Total sites: ${sites?.length || 0}\n`);

    console.log('Product Distribution:');
    console.log('─'.repeat(80));

    let singleSiteProducts = 0;
    let multiSiteProducts = 0;

    skuGroups.forEach((siteData, sku) => {
        if (siteData.length === 1) {
            singleSiteProducts++;
        } else {
            multiSiteProducts++;
        }

        console.log(`${sku} (${siteData[0].name}): ${siteData.length} site(s)`);
        siteData.forEach(s => {
            console.log(`  - ${s.site.padEnd(30)} Stock: ${s.stock}`);
        });
    });

    console.log('\n📝 Summary:');
    console.log(`   - Products at single site only: ${singleSiteProducts}`);
    console.log(`   - Products at multiple sites: ${multiSiteProducts}`);

    if (singleSiteProducts > 0 && sites && sites.length > 1) {
        console.log('\n⚠️  Issue Detected:');
        console.log(`   - You have ${sites.length} sites but products are only at 1 site`);
        console.log(`   - This means other warehouses have no inventory`);
        console.log('\n💡 Solution:');
        console.log(`   - The database has a UNIQUE constraint on SKU`);
        console.log(`   - This is correct: one SKU should represent one product globally`);
        console.log(`   - Products are filtered by site_id when loading data`);
        console.log(`   - When you receive a PO at a warehouse, it should update/create the product for that site`);
    }
}

checkProductDistribution();
