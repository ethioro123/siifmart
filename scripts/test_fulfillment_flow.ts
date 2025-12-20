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
    console.log('🚀 Starting Fulfillment Flow Test...');

    // 1. Create a Test Product (Optional, we can use custom items too, but let's be thorough)
    console.log('\n📦 Step 1: Creating Test Product...');
    const productId = crypto.randomUUID();
    const { data: product, error: prodError } = await supabase
        .from('products')
        .insert({
            id: productId,
            name: 'Terminal Test Product',
            sku: `TEST-${Date.now()}`,
            price: 100,
            stock: 0,
            category: 'Test',
            status: 'active'
        })
        .select()
        .single();

    if (prodError || !product) {
        console.error('❌ Failed to create product:', prodError);
        return;
    }
    console.log('✅ Product Created:', (product as any).id);

    // 2. Create a PO (Draft)
    console.log('\n📝 Step 2: Creating Purchase Order (Draft)...');
    const poId = crypto.randomUUID();
    const poNumber = `PO-${Date.now()}`;

    // We need a valid site ID. Let's fetch one or use a placeholder if none exist.
    const { data: sites } = await supabase.from('sites').select('id').limit(1);
    const siteId = sites && sites.length > 0 ? sites[0].id : '00000000-0000-0000-0000-000000000000'; // Fallback

    const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
            id: poId,
            po_number: poNumber,
            site_id: siteId,
            supplier_name: 'Test Supplier',
            status: 'Pending', // Mapped from 'Draft'
            total_amount: 1000,
            items_count: 10
        })
        .select()
        .single();

    if (poError || !po) {
        console.error('❌ Failed to create PO:', poError);
        return;
    }
    console.log('✅ PO Created:', (po as any).po_number, (po as any).id);

    // 2b. Add PO Items
    console.log('   Adding PO Items...');
    const { error: itemError } = await supabase
        .from('po_items')
        .insert({
            po_id: poId,
            product_id: productId,
            product_name: 'Terminal Test Product',
            quantity: 10,
            unit_cost: 100,
            total_cost: 1000
        });

    if (itemError) {
        console.error('❌ Failed to add PO items:', itemError);
        return;
    }
    console.log('✅ PO Items Added');

    // 3. Approve PO (Update notes with approval tag)
    console.log('\n👍 Step 3: Approving PO...');

    // Fetch current notes first
    const { data: currentPO } = await supabase
        .from('purchase_orders')
        .select('notes')
        .eq('id', poId)
        .single();

    const currentNotes = currentPO?.notes || '';
    const approvalTag = `\n[APPROVED_BY:Terminal Test:${new Date().toISOString()}]`;

    const { error: approveError } = await supabase
        .from('purchase_orders')
        .update({
            notes: currentNotes + approvalTag
            // Status remains 'Pending' in DB
        })
        .eq('id', poId);

    if (approveError) {
        console.error('❌ Failed to approve PO:', approveError);
        return;
    }
    console.log('✅ PO Approved');

    // 4. Receive PO (Update status to Received)
    console.log('\n🚚 Step 4: Receiving PO...');
    const { error: receiveError } = await supabase
        .from('purchase_orders')
        .update({
            status: 'Received'
        })
        .eq('id', poId);

    if (receiveError) {
        console.error('❌ Failed to receive PO:', receiveError);
        return;
    }
    console.log('✅ PO Received');

    // 5. Create Putaway Jobs (Simulating DataContext logic)
    console.log('\n🏗️ Step 5: Creating Putaway Jobs...');

    // Logic from DataContext: Create job for the line item
    const jobData = {
        // id: Let DB generate UUID
        site_id: siteId,
        type: 'PUTAWAY',
        status: 'Pending',
        priority: 'Normal',
        location: 'Receiving Dock',
        items_count: 10,
        order_ref: poId,
        line_items: [{
            productId: productId,
            name: 'Terminal Test Product',
            expectedQty: 10,
            pickedQty: 0,
            status: 'Pending'
        }]
    };

    const { data: job, error: jobError } = await supabase
        .from('wms_jobs')
        .insert(jobData)
        .select()
        .single();

    if (jobError || !job) {
        console.error('❌ Failed to create WMS Job:', jobError);
        return;
    }
    console.log('✅ Putaway Job Created:', (job as any).id);
    console.log('   Job Type:', (job as any).type);
    console.log('   Order Ref:', (job as any).order_ref);
    console.log('   Line Items:', JSON.stringify((job as any).line_items));

    // 6. Verify Final State
    console.log('\n🔍 Step 6: Verifying Final State...');

    // Check PO Status
    const { data: finalPO } = await supabase.from('purchase_orders').select('status').eq('id', poId).single();
    if (!finalPO || (finalPO as any).status !== 'Received') {
        console.error('❌ PO Status Mismatch:', finalPO?.status);
    } else {
        console.log('✅ PO Status is Received');
    }

    // Check Job Existence
    const { data: finalJob } = await supabase.from('wms_jobs').select('*').eq('id', job.id).single();
    if (!finalJob) {
        console.error('❌ Job not found in DB');
    } else {
        console.log('✅ Job verified in DB');
    }

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY');
}

runTest().catch(console.error);
