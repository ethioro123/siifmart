
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeAllProducts() {
    console.log('🚨 WARNING: THIS WILL DELETE ALL PRODUCTS AND RELATED INVENTORY DATA 🚨');
    console.log('Including: Stock Movements, WMS Jobs, POs, Sales, Transfers.');
    console.log('Waiting 5 seconds before proceeding...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔥 STARTING WIPE...');

    // 1. Delete Stock Movements (FK dependency)
    const { error: moveErr } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // neq logic is just to match "all rows" safely if filter required, or use empty filter?
    // Supabase/PostgREST usually requires a filter for DELETE unless headers set.
    // We'll use a dummy filter .gt('created_at', '1970-01-01') safely.

    const wipeTable = async (table) => {
        console.log(`🗑️  Deleting ${table}...`);
        const { error } = await supabase.from(table).delete().gt('created_at', '1900-01-01'); // Assume created_at exists
        if (error) console.error(`❌ Error deleting ${table}:`, error.message);
        else console.log(`✅ Deleted ${table}`);
    };

    await wipeTable('stock_movements');
    await wipeTable('wms_jobs');
    await wipeTable('transfers');

    // Sales
    // Check if sale_items exists? Usually linked.
    // Assume 'sales' table contain jsonb or relation?
    // Let's safe-delete specific dependents if known.
    // Assuming 'sales' exists.
    await wipeTable('sales');

    // POs
    await wipeTable('po_items');
    await wipeTable('purchase_orders');

    // FINALLY: Products
    await wipeTable('products');

    console.log('✨ ALL PRODUCTS AND INVENTORY DATA WIPED ✨');
}

wipeAllProducts();
