import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Realistic warehouse products
const warehouseProducts = [
    // Electronics & Tech
    { name: 'Laptop Dell XPS 15', sku: 'TECH-001', category: 'Electronics', costPrice: 1200, salePrice: 1599, stock: 15, location: 'A-01-01' },
    { name: 'iPhone 15 Pro', sku: 'TECH-002', category: 'Electronics', costPrice: 900, salePrice: 1199, stock: 25, location: 'A-01-02' },
    { name: 'Samsung 55" 4K TV', sku: 'TECH-003', category: 'Electronics', costPrice: 450, salePrice: 699, stock: 10, location: 'A-02-01' },
    { name: 'Sony WH-1000XM5 Headphones', sku: 'TECH-004', category: 'Electronics', costPrice: 280, salePrice: 399, stock: 30, location: 'A-02-02' },
    { name: 'iPad Air M2', sku: 'TECH-005', category: 'Electronics', costPrice: 500, salePrice: 699, stock: 20, location: 'A-02-03' },

    // Home & Furniture
    { name: 'Office Chair Ergonomic', sku: 'FURN-001', category: 'Furniture', costPrice: 150, salePrice: 249, stock: 12, location: 'B-01-01' },
    { name: 'Standing Desk Adjustable', sku: 'FURN-002', category: 'Furniture', costPrice: 300, salePrice: 499, stock: 8, location: 'B-01-02' },
    { name: 'Bookshelf 6-Tier', sku: 'FURN-003', category: 'Furniture', costPrice: 80, salePrice: 149, stock: 15, location: 'B-02-01' },
    { name: 'Sofa 3-Seater Grey', sku: 'FURN-004', category: 'Furniture', costPrice: 600, salePrice: 999, stock: 5, location: 'B-02-02' },
    { name: 'Dining Table Set (6 chairs)', sku: 'FURN-005', category: 'Furniture', costPrice: 400, salePrice: 699, stock: 6, location: 'B-03-01' },

    // Appliances
    { name: 'Dyson V15 Vacuum', sku: 'APPL-001', category: 'Appliances', costPrice: 450, salePrice: 699, stock: 18, location: 'C-01-01' },
    { name: 'KitchenAid Stand Mixer', sku: 'APPL-002', category: 'Appliances', costPrice: 280, salePrice: 449, stock: 22, location: 'C-01-02' },
    { name: 'Nespresso Coffee Machine', sku: 'APPL-003', category: 'Appliances', costPrice: 150, salePrice: 249, stock: 25, location: 'C-02-01' },
    { name: 'Air Fryer 6L', sku: 'APPL-004', category: 'Appliances', costPrice: 80, salePrice: 149, stock: 30, location: 'C-02-02' },
    { name: 'Robot Vacuum Roomba', sku: 'APPL-005', category: 'Appliances', costPrice: 350, salePrice: 599, stock: 14, location: 'C-03-01' },

    // Sports & Outdoors
    { name: 'Treadmill Foldable', sku: 'SPRT-001', category: 'Sports', costPrice: 400, salePrice: 699, stock: 8, location: 'D-01-01' },
    { name: 'Yoga Mat Premium', sku: 'SPRT-002', category: 'Sports', costPrice: 25, salePrice: 49, stock: 50, location: 'D-01-02' },
    { name: 'Dumbbell Set 20kg', sku: 'SPRT-003', category: 'Sports', costPrice: 60, salePrice: 99, stock: 20, location: 'D-02-01' },
    { name: 'Camping Tent 4-Person', sku: 'SPRT-004', category: 'Sports', costPrice: 120, salePrice: 199, stock: 12, location: 'D-02-02' },
    { name: 'Mountain Bike 27.5"', sku: 'SPRT-005', category: 'Sports', costPrice: 350, salePrice: 599, stock: 10, location: 'D-03-01' }
];

async function seedWarehouseProducts() {
    console.log('🏭 Seeding Warehouse Products...\n');

    try {
        // Get all warehouse sites
        const { data: sites, error: sitesError } = await supabase
            .from('sites')
            .select('*')
            .eq('type', 'Warehouse');

        if (sitesError) throw sitesError;

        if (!sites || sites.length === 0) {
            console.log('❌ No warehouses found!');
            console.log('   Creating a default warehouse...\n');

            // Create a warehouse
            const { data: newWarehouse, error: createError } = await supabase
                .from('sites')
                .insert({
                    name: 'Central Warehouse',
                    type: 'Warehouse',
                    address: '123 Industrial Blvd',
                    city: 'Melbourne',
                    state: 'VIC',
                    postal_code: '3000',
                    country: 'Australia',
                    phone: '+61 3 9000 0000',
                    terminal_count: 0
                })
                .select()
                .single();

            if (createError) throw createError;
            sites.push(newWarehouse);
            console.log('✅ Created warehouse:', newWarehouse.name);
        }

        console.log(`📦 Found ${sites.length} warehouse(s):\n`);
        sites.forEach(s => console.log(`   - ${s.name} (${s.id.substring(0, 8)}...)`));
        console.log('');

        let totalAdded = 0;

        for (const site of sites) {
            console.log(`\n🏭 Adding products to: ${site.name}`);
            console.log('─'.repeat(50));

            const productsToAdd = warehouseProducts.map(p => ({
                site_id: site.id,
                name: p.name,
                sku: `${site.id.substring(0, 4).toUpperCase()}-${p.sku}`,
                category: p.category,
                price: p.salePrice,
                cost_price: p.costPrice,
                sale_price: p.salePrice,
                stock: p.stock,
                location: p.location,
                status: p.stock > 10 ? 'active' : 'low_stock',
                image: '/placeholder-product.png',
                is_on_sale: false
            }));

            const { data: added, error: addError } = await supabase
                .from('products')
                .insert(productsToAdd)
                .select();

            if (addError) {
                console.error(`   ❌ Error adding products:`, addError.message);
                continue;
            }

            console.log(`   ✅ Added ${added.length} products`);
            totalAdded += added.length;

            // Show sample
            console.log(`\n   Sample products:`);
            added.slice(0, 3).forEach(p => {
                console.log(`   • ${p.name} - ${p.sku} - Stock: ${p.stock} - ${p.location}`);
            });
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 SUCCESS! Added ${totalAdded} products total`);
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Warehouses: ${sites.length}`);
        console.log(`   Products per warehouse: 20`);
        console.log(`   Total products added: ${totalAdded}`);
        console.log('\n✨ Ready to test fulfillment workflow!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

seedWarehouseProducts();
