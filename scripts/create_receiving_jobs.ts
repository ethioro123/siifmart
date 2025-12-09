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

async function createReceivingJobs() {
    console.log('📦 Creating 5 receiving jobs for warehouses...\n');

    try {
        // 1. Get all warehouse sites
        const { data: sites, error: sitesError } = await supabase
            .from('sites')
            .select('*')
            .in('type', ['Warehouse', 'Distribution Center']);

        if (sitesError) throw sitesError;

        if (!sites || sites.length === 0) {
            console.error('❌ No warehouse sites found!');
            return;
        }

        console.log(`Found ${sites.length} warehouse site(s)`);

        // 2. Get all products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .order('sku');

        if (productsError) throw productsError;

        if (!products || products.length < 25) {
            console.error('❌ Not enough products to create diverse POs');
            return;
        }

        // 3. Get suppliers
        const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .select('*')
            .limit(5);

        if (suppliersError) throw suppliersError;

        // Divide products into 5 groups (each PO gets unique products)
        const productsPerPO = Math.floor(products.length / 5);
        const productGroups = [
            products.slice(0, productsPerPO),
            products.slice(productsPerPO, productsPerPO * 2),
            products.slice(productsPerPO * 2, productsPerPO * 3),
            products.slice(productsPerPO * 3, productsPerPO * 4),
            products.slice(productsPerPO * 4)
        ];

        // 4. Create 5 Purchase Orders
        const createdPOs = [];

        for (let i = 0; i < 5; i++) {
            const warehouse = sites[i % sites.length]; // Cycle through warehouses if less than 5
            const supplier = suppliers?.[i % (suppliers?.length || 1)] || { id: 'SUPPLIER-001', name: 'Default Supplier' };
            const productGroup = productGroups[i];

            // Generate PO number (max 20 chars)
            const timestamp = Date.now().toString().slice(-8); // Last 8 digits
            const poNumber = `PO-RCV-${timestamp}-${i + 1}`; // e.g., PO-RCV-23673128-1
            const poId = crypto.randomUUID();

            // Create line items with medium quantities (50-200 units)
            const lineItems = productGroup.slice(0, 5 + i).map(product => ({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                quantity: 50 + Math.floor(Math.random() * 150), // 50-200 units
                unitPrice: product.price || 10,
                receivedQty: 0
            }));

            const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            // Create PO in database
            const { data: newPO, error: poError } = await supabase
                .from('purchase_orders')
                .insert({
                    id: poId,
                    site_id: warehouse.id,
                    po_number: poNumber,
                    supplier_id: supplier.id,
                    supplier_name: supplier.name,
                    order_date: new Date().toISOString().split('T')[0],
                    expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                    status: 'Pending', // Will map to "Approved" in frontend
                    total_amount: totalAmount,
                    items_count: lineItems.length,
                    notes: `Receiving job ${i + 1} - ${lineItems.length} unique products for ${warehouse.name}`
                })
                .select()
                .single();

            if (poError) {
                console.error(`❌ Failed to create PO ${poNumber}:`, poError.message);
                continue;
            }

            // Create line items
            const lineItemsToInsert = lineItems.map(item => ({
                id: crypto.randomUUID(),
                po_id: poId,
                product_id: item.productId,
                product_name: item.name,
                quantity: item.quantity,
                unit_cost: item.unitPrice,
                total_cost: item.quantity * item.unitPrice
            }));

            const { error: itemsError } = await supabase
                .from('po_items')
                .insert(lineItemsToInsert);

            if (itemsError) {
                console.error(`❌ Failed to create line items for ${poNumber}:`, itemsError.message);
                // Delete the PO if line items failed
                await supabase.from('purchase_orders').delete().eq('id', poId);
                continue;
            }

            createdPOs.push({
                poNumber,
                warehouse: warehouse.name,
                supplier: supplier.name,
                items: lineItems.length,
                totalQty: lineItems.reduce((sum, item) => sum + item.quantity, 0),
                totalAmount
            });

            console.log(`✅ Created ${poNumber}`);
            console.log(`   Warehouse: ${warehouse.name}`);
            console.log(`   Supplier: ${supplier.name}`);
            console.log(`   Items: ${lineItems.length} products`);
            console.log(`   Total Qty: ${lineItems.reduce((sum, item) => sum + item.quantity, 0)} units`);
            console.log(`   Total Amount: $${totalAmount.toFixed(2)}`);
            console.log(`   Products: ${lineItems.map(i => i.sku).join(', ')}`);
            console.log('');
        }

        console.log('\n✅ Receiving jobs created successfully!\n');
        console.log('📝 Summary:');
        console.log(`   - ${createdPOs.length} Purchase Orders created`);
        console.log(`   - Total items: ${createdPOs.reduce((sum, po) => sum + po.items, 0)}`);
        console.log(`   - Total quantity: ${createdPOs.reduce((sum, po) => sum + po.totalQty, 0)} units`);
        console.log(`   - Total value: $${createdPOs.reduce((sum, po) => sum + po.totalAmount, 0).toFixed(2)}`);
        console.log('\n🎯 Next steps:');
        console.log('   1. Go to Procurement → Receive tab');
        console.log('   2. You will see 5 new POs with status "Approved"');
        console.log('   3. Receive each PO to create PUTAWAY jobs');
        console.log('   4. Each PO has unique products (no duplicates across POs)');

    } catch (error) {
        console.error('\n❌ Error creating receiving jobs:', error);
        process.exit(1);
    }
}

createReceivingJobs();
