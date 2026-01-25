
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificPO() {
    console.log('🔍 Checking PO AAAA0057...');

    const { data: po, error } = await supabase
        .from('purchase_orders')
        .select('*, po_items(*)')
        .eq('po_number', 'AAAA0057')
        .single();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (!po) {
        console.log('PO not found.');
        return;
    }

    console.log(`PO ${po.po_number} Status: ${po.status}`);
    po.po_items.forEach((item: any) => {
        console.log(`- Item: ${item.product_name}`);
        console.log(`  ID: ${item.id}`);
        console.log(`  Product ID: ${item.product_id}`);
        console.log(`  Retail Price (DB Column): ${item.retail_price}`);
    });
}

checkSpecificPO();
