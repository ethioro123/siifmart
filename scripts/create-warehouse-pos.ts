import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function createWarehousePOs() {
    console.log('📦 Creating Purchase Orders for Warehouses...\n');

    try {
        // Get all warehouses
        const { data: warehouses, error: whError } = await supabase
            .from('sites')
            .select('*')
            .eq('type', 'Warehouse');

        if (whError) throw whError;

        console.log(`🏭 Found ${warehouses.length} warehouses\n`);

        // Get all suppliers
        const { data: suppliers, error: suppError } = await supabase
            .from('suppliers')
            .select('*');

        if (suppError) throw suppError;

        if (!suppliers || suppliers.length === 0) {
            console.log('⚠️  No suppliers found. Creating default suppliers...\n');

            const defaultSuppliers = [
                {
                    name: 'Tech Distributors Inc',
                    type: 'Business',
                    contact: '+61 3 9000 1111',
                    email: 'orders@techdist.com.au',
                    address: '456 Supply St, Melbourne VIC 3000',
                    rating: 4.5,
                    lead_time: 3
                },
                {
                    name: 'Furniture Wholesale Co',
                    type: 'Business',
                    contact: '+61 3 9000 2222',
                    email: 'sales@furnwholesale.com.au',
                    address: '789 Trade Rd, Sydney NSW 2000',
                    rating: 4.2,
                    lead_time: 5
                },
                {
                    name: 'Appliance Direct',
                    type: 'Business',
                    contact: '+61 3 9000 3333',
                    email: 'orders@appliancedirect.com.au',
                    address: '321 Industrial Ave, Brisbane QLD 4000',
                    rating: 4.7,
                    lead_time: 2
                }
            ];

            const { data: newSuppliers, error: createError } = await supabase
                .from('suppliers')
                .insert(defaultSuppliers)
                .select();

            if (createError) throw createError;
            suppliers.push(...newSuppliers);
            console.log(`✅ Created ${newSuppliers.length} suppliers\n`);
        }

        console.log(`📋 Found ${suppliers.length} suppliers\n`);

        let totalPOs = 0;

        for (const warehouse of warehouses) {
            console.log(`\n🏭 Creating POs for: ${warehouse.name}`);
            console.log('─'.repeat(50));

            // Get products for this warehouse
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('site_id', warehouse.id)
                .limit(10); // Create PO for first 10 products

            if (prodError) throw prodError;

            if (!products || products.length === 0) {
                console.log('   ⚠️  No products found for this warehouse');
                continue;
            }

            // Create 2-3 POs per warehouse with different suppliers
            const numPOs = Math.min(3, suppliers.length);

            for (let i = 0; i < numPOs; i++) {
                const supplier = suppliers[i % suppliers.length];
                const poProducts = products.slice(i * 3, (i + 1) * 3); // 3 products per PO

                if (poProducts.length === 0) continue;

                // Calculate PO details
                const lineItems = poProducts.map(p => ({
                    productId: p.id,
                    productName: p.name,
                    sku: p.sku,
                    quantity: Math.floor(Math.random() * 20) + 10, // 10-30 units
                    unitPrice: p.cost_price || p.price * 0.7,
                    total: (Math.floor(Math.random() * 20) + 10) * (p.cost_price || p.price * 0.7)
                }));

                const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = subtotal * 0.1; // 10% tax
                const shippingCost = 50 + Math.random() * 100; // $50-150 shipping
                const totalAmount = subtotal + taxAmount + shippingCost;

                // Create PO
                const po = {
                    site_id: warehouse.id,
                    supplier_id: supplier.id,
                    supplier_name: supplier.name,
                    order_date: new Date().toISOString().split('T')[0],
                    status: 'Pending',
                    total_amount: Math.round(totalAmount * 100) / 100,
                    items_count: lineItems.length,
                    expected_delivery: new Date(Date.now() + (supplier.lead_time || 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    shipping_cost: Math.round(shippingCost * 100) / 100,
                    tax_amount: Math.round(taxAmount * 100) / 100,
                    payment_terms: 'Net 30',
                    notes: `Restocking order for ${warehouse.name} - Items: ${lineItems.map(i => i.productName).join(', ')}`
                };

                const { data: createdPO, error: poError } = await supabase
                    .from('purchase_orders')
                    .insert(po)
                    .select()
                    .single();

                if (poError) {
                    console.error(`   ❌ Error creating PO:`, poError.message);
                    continue;
                }

                console.log(`   ✅ PO #${createdPO.id.substring(0, 8)}... - ${supplier.name}`);
                console.log(`      Items: ${lineItems.length} | Total: $${totalAmount.toFixed(2)} | Delivery: ${po.expected_delivery}`);

                totalPOs++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 SUCCESS! Created ${totalPOs} Purchase Orders`);
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Warehouses: ${warehouses.length}`);
        console.log(`   Suppliers: ${suppliers.length}`);
        console.log(`   Total POs: ${totalPOs}`);
        console.log(`   Avg POs per warehouse: ${(totalPOs / warehouses.length).toFixed(1)}`);
        console.log('\n✨ Next Steps:');
        console.log('   1. Go to Procurement page');
        console.log('   2. View pending purchase orders');
        console.log('   3. Approve POs');
        console.log('   4. Receive goods in WMS Operations → RECEIVE tab');
        console.log('   5. Test the complete fulfillment workflow!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

createWarehousePOs();
