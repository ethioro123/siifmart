import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching PO AAAA0091...");
    const { data: po, error: poError } = await supabase.from('purchase_orders').select('id, status').eq('po_number', 'AAAA0091').single();
    if (poError || !po) return console.log('PO not found', poError);
    
    console.log("Found PO:", po.id);
    const { data: items, error: itemsError } = await supabase.from('po_items').select('*').eq('po_id', po.id);
    console.log("Items Error:", itemsError);
    console.log("Items:", JSON.stringify(items, null, 2));
}

check();
