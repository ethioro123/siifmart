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

async function setupMultiSiteProducts() {
    console.log('🏭 Setting up products for each warehouse...\n');

    try {
        // 1. Get all warehouse sites
        const { data: warehouses, error: warehousesError } = await supabase
            .from('sites')
            .select('*')
            .in('type', ['Warehouse', 'Distribution Center']);

        if (warehousesError) throw warehousesError;

        if (!warehouses || warehouses.length === 0) {
            console.error('❌ No warehouse sites found!');
            return;
        }

        console.log(`Found ${warehouses.length} warehouse site(s):`);
        warehouses.forEach(w => console.log(`  - ${w.name} (${w.id.substring(0, 8)}...)`));

        // 2. Get all unique products (by SKU) from the first warehouse
        const { data: masterProducts, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('site_id', warehouses[0].id)
            .order('sku');

        if (productsError) throw productsError;

        if (!masterProducts || masterProducts.length === 0) {
            console.error('❌ No master products found!');
            return;
        }

        console.log(`\nFound ${masterProducts.length} master products to replicate\n`);

        // 3. For each warehouse (except the first), create product instances
        let totalCreated = 0;
        let totalSkipped = 0;

        for (let i = 1; i < warehouses.length; i++) {
            const warehouse = warehouses[i];
            console.log(`\n📦 Setting up products for ${warehouse.name}...`);

            for (const masterProduct of masterProducts) {
                // Check if product already exists at this warehouse
                const { data: existing } = await supabase
                    .from('products')
                    .select('id')
                    .eq('site_id', warehouse.id)
                    .eq('sku', masterProduct.sku)
                    .single();

                if (existing) {
                    console.log(`   ⏭️  ${masterProduct.sku} already exists`);
                    totalSkipped++;
                    continue;
                }

                // Create product instance for this warehouse
                const newProduct = {
                    site_id: warehouse.id,
                    name: masterProduct.name,
                    sku: masterProduct.sku,
                    category: masterProduct.category,
                    price: masterProduct.price,
                    cost_price: masterProduct.cost_price,
                    sale_price: masterProduct.sale_price,
                    is_on_sale: masterProduct.is_on_sale,
                    stock: 0, // Start with 0 stock (will be updated when receiving)
                    status: 'out_of_stock',
                    location: 'Receiving Dock',
                    image: masterProduct.image,
                    expiry_date: masterProduct.expiry_date,
                    batch_number: null, // Will be set during receiving
                    shelf_position: masterProduct.shelf_position,
                    competitor_price: masterProduct.competitor_price,
                    sales_velocity: masterProduct.sales_velocity
                };

                const { error: createError } = await supabase
                    .from('products')
                    .insert(newProduct);

                if (createError) {
                    console.error(`   ❌ Failed to create ${masterProduct.sku}:`, createError.message);
                } else {
                    console.log(`   ✅ Created ${masterProduct.sku} - ${masterProduct.name}`);
                    totalCreated++;
                }
            }
        }

        console.log('\n✅ Multi-site product setup complete!\n');
        console.log('📝 Summary:');
        console.log(`   - ${warehouses.length} warehouses`);
        console.log(`   - ${masterProducts.length} unique products (SKUs)`);
        console.log(`   - ${totalCreated} new product instances created`);
        console.log(`   - ${totalSkipped} already existed`);
        console.log(`   - Total products in system: ${masterProducts.length * warehouses.length}`);

        console.log('\n🎯 Next steps:');
        console.log('   1. Each warehouse now has its own product instances');
        console.log('   2. When you receive a PO at a warehouse, stock updates for that warehouse only');
        console.log('   3. Switch between sites to see different inventory levels');
        console.log('   4. Use transfers to move stock between warehouses');

    } catch (error) {
        console.error('\n❌ Error setting up multi-site products:', error);
        process.exit(1);
    }
}

setupMultiSiteProducts();
