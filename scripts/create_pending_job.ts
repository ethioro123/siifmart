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

async function createPendingJob() {
    console.log('🚀 Creating FRESH Pending Putaway Job...');

    // 1. Create Product
    const productId = crypto.randomUUID();
    await supabase.from('products').insert({
        id: productId,
        name: 'UI Test Product',
        sku: `UI-${Date.now()}`,
        price: 50,
        stock: 0,
        category: 'Test',
        status: 'active'
    });
    console.log('✅ Product Created');

    // 2. Create PO
    const poId = crypto.randomUUID();
    const { data: sites } = await supabase.from('sites').select('id').limit(1);
    const siteId = sites?.[0]?.id;

    await supabase.from('purchase_orders').insert({
        id: poId,
        po_number: `PO-UI-${Date.now()}`,
        site_id: siteId,
        supplier_name: 'Test Supplier',
        status: 'Received', // Already received to trigger job
        total_amount: 500,
        items_count: 10,
        approved_by: 'Script', // Workaround not needed for raw insert if column missing, but we use notes
        notes: '[APPROVED_BY:Script:Now]'
    });
    console.log('✅ PO Created');

    // 3. Create Pending Job
    const jobId = crypto.randomUUID();
    const { error } = await supabase.from('wms_jobs').insert({
        id: jobId,
        site_id: siteId,
        type: 'PUTAWAY',
        status: 'Pending', // IMPORTANT: Pending
        priority: 'Normal',
        location: 'Receiving Dock',
        items_count: 10,
        order_ref: poId,
        line_items: [{
            productId: productId,
            name: 'UI Test Product',
            expectedQty: 10,
            pickedQty: 0,
            status: 'Pending'
        }]
    });

    if (error) {
        console.error('❌ Failed:', error);
    } else {
        console.log(`✅ JOB CREATED: ${jobId}`);
        console.log('👉 Go to WMS Operations -> PUTAWAY tab now!');
        console.log('👉 You should see a job for "UI Test Product"');
    }
}

createPendingJob();
