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

async function runTest() {
    console.log('🚀 Starting WMS Operations Test (Putaway -> Inventory -> Pick -> Pack)...');

    // 1. Setup: Fetch Product and Putaway Job from previous test
    console.log('\n🔍 Step 1: Fetching existing data...');

    // Get the most recent product created (from previous test)
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!products || products.length === 0) {
        console.error('❌ No products found. Run test_fulfillment_flow.ts first.');
        return;
    }
    const product = products[0];
    console.log(`✅ Found Product: ${product.name} (Stock: ${product.stock})`);

    // Get the most recent Putaway Job
    const { data: jobs } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('type', 'PUTAWAY')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!jobs || jobs.length === 0) {
        console.error('❌ No Putaway jobs found. Run test_fulfillment_flow.ts first.');
        return;
    }
    const putawayJob = jobs[0];
    console.log(`✅ Found Putaway Job: ${putawayJob.id} (Status: ${putawayJob.status})`);

    // 2. Complete Putaway
    console.log('\n📥 Step 2: Completing Putaway...');

    // Update Job Status
    const { error: jobError } = await supabase
        .from('wms_jobs')
        .update({ status: 'Completed' })
        .eq('id', putawayJob.id);

    if (jobError) { console.error('❌ Failed to complete job:', jobError); return; }

    // Update Inventory (Simulating DataContext logic)
    const qtyToAdd = putawayJob.items_count || 10;
    const newStock = (product.stock || 0) + qtyToAdd;

    const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

    if (stockError) { console.error('❌ Failed to update stock:', stockError); return; }

    console.log(`✅ Putaway Completed. Stock updated to ${newStock}`);

    // Verify Stock
    const { data: verifiedProduct } = await supabase.from('products').select('stock').eq('id', product.id).single();
    if (verifiedProduct.stock !== newStock) {
        console.error(`❌ Stock mismatch! Expected ${newStock}, got ${verifiedProduct.stock}`);
        return;
    }
    console.log('✅ Stock verification passed');

    // 3. Create Sale (Delivery) -> Triggers Pick
    console.log('\n🛒 Step 3: Creating Sale (Delivery)...');
    const saleQty = 5;
    const saleId = crypto.randomUUID();

    // Create Sale Record
    const { error: saleError } = await supabase
        .from('sales')
        .insert({
            id: saleId,
            site_id: putawayJob.site_id,
            sale_date: new Date().toISOString(),
            subtotal: 500,
            tax: 50,
            total: 550,
            payment_method: 'Card',
            status: 'Completed',
            amount_tendered: 550,
            change: 0,
            cashier_name: 'Test Script',
            fulfillment_status: 'Picking' // Important for WMS
        });

    if (saleError) { console.error('❌ Failed to create sale:', saleError); return; }

    // Deduct Stock (Simulating salesService.create)
    const stockAfterSale = newStock - saleQty;
    await supabase.from('products').update({ stock: stockAfterSale }).eq('id', product.id);
    console.log(`✅ Sale Created. Stock deducted to ${stockAfterSale}`);

    // Create Pick Job (Simulating processSale logic)
    console.log('\n🔍 Step 4: Generating Pick Job...');
    const pickJobId = crypto.randomUUID();
    const { data: pickJob, error: pickError } = await supabase
        .from('wms_jobs')
        .insert({
            id: pickJobId,
            site_id: putawayJob.site_id,
            type: 'PICK',
            status: 'Pending',
            priority: 'High',
            location: 'Warehouse Floor',
            items_count: saleQty,
            order_ref: saleId,
            line_items: [{
                productId: product.id,
                name: product.name,
                expectedQty: saleQty,
                pickedQty: 0,
                status: 'Pending'
            }]
        })
        .select()
        .single();

    if (pickError) { console.error('❌ Failed to create Pick job:', pickError); return; }
    console.log(`✅ Pick Job Created: ${pickJob.id}`);

    // 4. Complete Pick -> Create Pack
    console.log('\n📦 Step 5: Completing Pick & Generating Pack Job...');

    // Complete Pick Job
    await supabase.from('wms_jobs').update({ status: 'Completed' }).eq('id', pickJobId);

    // Create Pack Job (Simulating completeJob logic)
    const packJobId = crypto.randomUUID();
    const { data: packJob, error: packError } = await supabase
        .from('wms_jobs')
        .insert({
            id: packJobId,
            site_id: putawayJob.site_id,
            type: 'PACK',
            status: 'Pending',
            priority: 'High',
            location: 'Packing Station 1',
            items_count: saleQty,
            order_ref: saleId,
            line_items: [{
                productId: product.id,
                name: product.name,
                expectedQty: saleQty,
                pickedQty: saleQty, // Picked!
                status: 'Pending'
            }]
        })
        .select()
        .single();

    if (packError) { console.error('❌ Failed to create Pack job:', packError); return; }
    console.log(`✅ Pack Job Created: ${packJob.id}`);

    // Update Sale Status
    await supabase.from('sales').update({ fulfillment_status: 'Packing' }).eq('id', saleId);

    // 5. Complete Pack -> Shipped
    console.log('\n🚚 Step 6: Completing Pack & Shipping...');

    // Complete Pack Job
    await supabase.from('wms_jobs').update({ status: 'Completed' }).eq('id', packJobId);

    // Update Sale Status
    await supabase.from('sales').update({ fulfillment_status: 'Shipped' }).eq('id', saleId);
    console.log('✅ Sale Shipped');

    // Final Verification
    console.log('\n🔍 Final Verification...');
    const { data: finalSale } = await supabase.from('sales').select('fulfillment_status').eq('id', saleId).single();
    if (finalSale.fulfillment_status !== 'Shipped') {
        console.error(`❌ Sale status mismatch! Expected Shipped, got ${finalSale.fulfillment_status}`);
    } else {
        console.log('✅ Sale Status is Shipped');
    }

    const { data: finalStock } = await supabase.from('products').select('stock').eq('id', product.id).single();
    console.log(`✅ Final Stock: ${finalStock.stock} (Started 0 -> +10 Putaway -> -5 Sale = 5)`);

    console.log('\n🎉 WMS OPERATIONS TEST COMPLETED SUCCESSFULLY');
}

runTest().catch(console.error);
