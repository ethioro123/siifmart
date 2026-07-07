
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('--- STARTING DUPLICATE PRODUCT TEST ---');

    // 1. Setup Data
    const timestamp = Date.now();
    const sku = `TEST-SKU-${timestamp}`;
    const productName = `Test Product ${timestamp}`;

    const siteId = 'bb0425bc-3119-449a-a685-b871e552bee0'; // Valid Site ID

    console.log(`\n1. Creating PO with NEW item (SKU: ${sku})...`);

    // Simulate Procurement.tsx logic: Pre-create product as "On Order"
    const { data: preProduct, error: preError } = await supabase
        .from('products')
        .insert({
            name: productName,
            sku: sku,
            category: 'Test',
            price: 10,
            cost_price: 5,
            stock: 0,
            site_id: siteId,
            location: 'On Order', // The problematic starting state
            status: 'active'
        })
        .select()
        .single();

    if (preError) {
        console.error('Failed to pre-create product:', preError);
        return;
    }
    console.log(`   ✅ Pre-created product ID: ${preProduct.id}, Location: '${preProduct.location}'`);

    // Create PO linked to this product
    const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
            po_number: `PO-${timestamp}`,
            site_id: siteId,
            supplier_id: '4bae0cba-70c6-4637-a8d5-447e8739dcbf', // Valid Supplier ID
            supplier_name: 'Test Supplier',
            status: 'Ordered',
            total_amount: 100,
            items_count: 1
        })
        .select()
        .single();

    if (poError) {
        console.error('Failed to create PO:', poError);
        return;
    }
    console.log(`   ✅ Created PO: ${po.po_number} (ID: ${po.id})`);

    // Insert PO Items
    const { error: itemError } = await supabase
        .from('po_items')
        .insert({
            po_id: po.id,
            product_id: preProduct.id,
            product_name: productName,
            quantity: 10,
            unit_cost: 10,
            total_cost: 100,
            identity_type: 'known'
        });

    if (itemError) {
        console.error('Failed to create PO Item:', itemError);
        return;
    }

    // 2. Simulate "Receive PO" (simplified logic from FulfillmentDataProvider.tsx)
    console.log('\n2. Simulating Receive PO...');

    // Fetch the PO to get line items (mocking what the frontend does)
    const { data: fetchedPO } = await supabase.from('purchase_orders').select('*').eq('id', po.id).single();

    // Fetch PO Items separately
    const { data: poItems } = await supabase
        .from('po_items')
        .select('*')
        .eq('po_id', po.id);

    if (!poItems || poItems.length === 0) {
        console.error('No PO items found');
        return;
    }
    const lineItem = poItems[0];
    // Map snake_case to camelCase for simulate logic if needed, but here we just use IDs
    const productIdToUse = lineItem.product_id;

    console.log(`   Processing Item: ${lineItem.product_name} (ID: ${productIdToUse})`);

    // CHECK: Does receiving create a NEW product?
    // In `receivePO`, it calls `wmsJobsService.create`. 
    // Code read shows it USES the productId from lineItem.
    // BUT, let's see if the database trigger or some other mechanism is doing something weird.

    // We'll simulate creating the WMS Job, as that's what receivePO does.
    const { data: job, error: jobError } = await supabase
        .from('wms_jobs')
        .insert({
            site_id: siteId,
            type: 'PUTAWAY',
            status: 'Pending',
            items: 1,
            location: 'Receiving Dock',
            order_ref: po.id,
            line_items: [{
                productId: lineItem.productId,
                sku: sku,
                name: productName,
                expectedQty: 10,
                status: 'Pending'
            }]
        })
        .select()
        .single();

    if (jobError) {
        console.error('Failed to create Job:', jobError);
    } else {
        console.log(`   ✅ Created Putaway Job: ${job.id}`);
    }

    // 3. CHECK FOR DUPLICATES
    console.log('\n3. Checking for duplicates...');
    const { data: products } = await supabase
        .from('products')
        .select('id, sku, name, location, stock')
        .eq('sku', sku);

    console.table(products);

    if (!products) {
        console.error('❌ FAILURE: No products returned from query.');
        return;
    }

    if (products.length > 1) {
        console.error('❌ FAILURE: Duplicate products found!');
    } else if (products.length === 1) {
        console.log('✅ SUCCESS: Only one product exists.');
        if (products[0].location === 'On Order') {
            console.log('   ⚠️ ADVICE: Product is still "On Order". Putaway needs to update this.');
        }
    } else {
        console.error('❌ WEIRD: No products found?');
    }

    console.log('\n--- TEST COMPLETE ---');
}

runTest();
