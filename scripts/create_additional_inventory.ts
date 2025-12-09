import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdditionalInventory() {
    console.log('📦 Creating 10 ADDITIONAL products with large inventory PO...');

    // Get first site
    const { data: sites } = await supabase.from('sites').select('id, name').limit(1);
    const siteId = sites?.[0]?.id;

    if (!siteId) {
        console.error('❌ No site found');
        return;
    }

    console.log(`✅ Using site: ${sites[0].name}`);

    // Define 10 MORE diverse products with large quantities
    const products = [
        { name: 'Fresh Milk 1L', sku: 'MILK-001', category: 'Dairy', price: 4.50, qty: 450 },
        { name: 'Cheese Block 500g', sku: 'CHEESE-001', category: 'Dairy', price: 12.00, qty: 200 },
        { name: 'Eggs Tray 30pk', sku: 'EGGS-001', category: 'Dairy', price: 8.50, qty: 350 },
        { name: 'Bread Loaf White', sku: 'BREAD-001', category: 'Bakery', price: 2.50, qty: 600 },
        { name: 'Coffee Beans 1kg', sku: 'COFFEE-001', category: 'Beverages', price: 35.00, qty: 150 },
        { name: 'Tea Bags 100pk', sku: 'TEA-001', category: 'Beverages', price: 8.00, qty: 400 },
        { name: 'Chicken Breast 1kg', sku: 'CHICKEN-001', category: 'Meat', price: 18.00, qty: 300 },
        { name: 'Ground Beef 1kg', sku: 'BEEF-001', category: 'Meat', price: 22.00, qty: 250 },
        { name: 'Dish Soap 500ml', sku: 'SOAP-001', category: 'Household', price: 5.50, qty: 500 },
        { name: 'Paper Towels 6pk', sku: 'TOWEL-001', category: 'Household', price: 11.00, qty: 400 }
    ];

    // Create products
    const productIds: string[] = [];
    for (const product of products) {
        const productId = crypto.randomUUID();
        const { error } = await supabase.from('products').upsert({
            id: productId,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: 0, // Start with 0 stock
            category: product.category,
            status: 'active',
            site_id: siteId,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'
        }, { onConflict: 'sku' });

        if (error) {
            console.error(`❌ Failed to create ${product.name}:`, error);
        } else {
            console.log(`✅ Created product: ${product.name} (${product.sku})`);
            productIds.push(productId);
        }
    }

    // Create Purchase Order
    const poId = crypto.randomUUID();
    const poNumber = `PO-FRESH-${Date.now().toString().slice(-8)}`;
    const totalAmount = products.reduce((sum, p) => sum + (p.price * p.qty), 0);

    const { error: poError } = await supabase.from('purchase_orders').insert({
        id: poId,
        po_number: poNumber,
        site_id: siteId,
        supplier_name: 'Fresh Foods & More Ltd',
        status: 'Pending',
        total_amount: totalAmount,
        items_count: products.length,
        notes: `[APPROVED_BY:System:${new Date().toISOString()}] Fresh inventory restock - ${products.length} product lines (Dairy, Meat, Bakery)`
    });

    if (poError) {
        console.error('❌ Failed to create PO:', poError);
        return;
    }

    console.log(`✅ Created PO: ${poNumber} (Total: $${totalAmount.toLocaleString()})`);

    // Create PO Items
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const { error: itemError } = await supabase.from('po_items').insert({
            po_id: poId,
            product_id: productIds[i],
            product_name: product.name,
            quantity: product.qty,
            unit_cost: product.price,
            total_cost: product.price * product.qty
        });

        if (itemError) {
            console.error(`❌ Failed to create PO item for ${product.name}:`, itemError);
        }
    }

    console.log('✅ All PO items created');
    console.log('');
    console.log('🎉 ADDITIONAL INVENTORY COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • NEW Products Created: ${products.length}`);
    console.log(`   • Total Units: ${products.reduce((sum, p) => sum + p.qty, 0).toLocaleString()}`);
    console.log(`   • PO Number: ${poNumber}`);
    console.log(`   • Total Value: $${totalAmount.toLocaleString()}`);
    console.log('');
    console.log('📦 Product Categories:');
    console.log('   • Dairy (Milk, Cheese, Eggs)');
    console.log('   • Bakery (Bread)');
    console.log('   • Beverages (Coffee, Tea)');
    console.log('   • Meat (Chicken, Beef)');
    console.log('   • Household (Soap, Towels)');
    console.log('');
    console.log('👉 You now have 2 large POs ready to receive!');
}

createAdditionalInventory();
