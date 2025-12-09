
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestData() {
    console.log('🧹 Cleaning up Test Data...');

    // 1. Delete Test Jobs (Unlinks them)
    const { error: jobError } = await supabase.from('wms_jobs')
        .delete()
        .ilike('job_number', '%PO-TEST%');
    if (jobError) console.error('Job Del Error:', jobError);
    else console.log('✅ Deleted Test Jobs');

    // 2. Delete POs (Assuming cascade or explicit item delete)
    // First delete items explicitly to be safe?
    // We can't query items easily by PO Number unless we fetch POs first.
    const { data: pos } = await supabase.from('purchase_orders').select('id').ilike('po_number', 'PO-TEST%');
    if (pos && pos.length > 0) {
        const pids = pos.map(p => p.id);
        await supabase.from('po_items').delete().in('po_id', pids);
        await supabase.from('purchase_orders').delete().in('id', pids);
        console.log('✅ Deleted Test POs and Items');
    }

    // 3. Delete Products and Movements
    const { data: prods } = await supabase.from('products').select('id').ilike('sku', 'TEST-%');
    if (prods && prods.length > 0) {
        const prdIds = prods.map(p => p.id);

        // Delete Movements
        await supabase.from('stock_movements').delete().in('product_id', prdIds);

        // Delete Products
        const { error: pErr } = await supabase.from('products').delete().in('id', prdIds);

        if (pErr) console.error('Prod Del Error:', pErr);
        else console.log('✅ Deleted Test Products and Movements');
    }

}

cleanupTestData();
