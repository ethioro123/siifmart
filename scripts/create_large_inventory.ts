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

async function createLargeInventoryPO() {
    console.log('📦 Creating 10 new products with large inventory PO...');

    // Get first site
    const { data: sites } = await supabase.from('sites').select('id, name').limit(1);
    const siteId = sites?.[0]?.id;

    if (!siteId) {
        console.error('❌ No site found');
        return;
    }

    console.log(`✅ Using site: ${sites[0].name}`);

    // Define 10 diverse products with large quantities
    const products = [
        { name: 'Premium Rice 25kg', sku: 'RICE-001', category: 'Groceries', price: 45.00, qty: 500 },
        { name: 'Cooking Oil 5L', sku: 'OIL-001', category: 'Groceries', price: 28.50, qty: 300 },
        { name: 'Sugar 50kg Bag', sku: 'SUGAR-001', category: 'Groceries', price: 85.00, qty: 200 },
        { name: 'Wheat Flour 25kg', sku: 'FLOUR-001', category: 'Groceries', price: 38.00, qty: 400 },
        { name: 'Bottled Water 24pk', sku: 'WATER-001', category: 'Beverages', price: 12.00, qty: 600 },
        { name: 'Soft Drinks 12pk', sku: 'SODA-001', category: 'Beverages', price: 18.50, qty: 350 },
        { name: 'Pasta 500g Box', sku: 'PASTA-001', category: 'Groceries', price: 5.50, qty: 800 },
        { name: 'Canned Tomatoes 400g', sku: 'TOMATO-001', category: 'Groceries', price: 3.25, qty: 1000 },
        { name: 'Laundry Detergent 2kg', sku: 'DETERG-001', category: 'Household', price: 22.00, qty: 250 },
        { name: 'Toilet Paper 24pk', sku: 'TISSUE-001', category: 'Household', price: 16.50, qty: 400 }
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
            image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&q=80&w=200'
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
    const poNumber = `PO-BULK-${Date.now().toString().slice(-8)}`;
    const totalAmount = products.reduce((sum, p) => sum + (p.price * p.qty), 0);

    const { error: poError } = await supabase.from('purchase_orders').insert({
        id: poId,
        po_number: poNumber,
        site_id: siteId,
        supplier_name: 'Bulk Wholesale Distributors',
        status: 'Pending',
        total_amount: totalAmount,
        items_count: products.length,
        notes: `[APPROVED_BY:System:${new Date().toISOString()}] Large inventory restock - ${products.length} product lines`
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
    console.log('🎉 SETUP COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Products Created: ${products.length}`);
    console.log(`   • Total Units: ${products.reduce((sum, p) => sum + p.qty, 0).toLocaleString()}`);
    console.log(`   • PO Number: ${poNumber}`);
    console.log(`   • Total Value: $${totalAmount.toLocaleString()}`);
    console.log('');
    console.log('👉 Next Steps:');
    console.log('   1. Go to Procurement → Approve the PO');
    console.log('   2. Go to WMS Operations → RECEIVE tab');
    console.log('   3. Receive the PO to create PUTAWAY jobs');
    console.log('   4. Complete PUTAWAY jobs to stock the warehouse');
}

createLargeInventoryPO();
