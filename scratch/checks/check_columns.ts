
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
    console.log('--- Checking purchase_orders columns ---');
    // Try to insert invalid data to force an error listing known columns
    const { error } = await supabase.from('purchase_orders').insert({ 'invalid_col': 123 });
    if (error) {
        console.log('Insert Error (contains column hints?):');
        console.log(error.message);
        console.log(error.hint);
    }

    console.log('\n--- Checking for po_items table ---');
    const { data, error: tableError } = await supabase.from('po_items').select('*').limit(1);
    if (!tableError) {
        console.log('✅ Found po_items table!');
        if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]));
        else console.log('Table exists but empty.');
    } else {
        console.log('❌ po_items table not found:', tableError.message);
    }
}
check();
