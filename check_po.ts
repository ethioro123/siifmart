import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: po } = await supabase.from('purchase_orders').select('id, status').eq('po_number', 'AAAA0091').single();
    if (!po) return console.log('PO not found');
    const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id);
    console.log(JSON.stringify(items, null, 2));
}

check();
