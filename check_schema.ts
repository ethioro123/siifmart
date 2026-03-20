
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkTable() {
    const { data, error } = await supabase.from('purchase_orders').select('*').limit(1);
    if (error) {
        console.error('Error fetching POs:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Found PO. Columns:', Object.keys(data[0]));
        // Check Specifically for line items
        console.log('Line Items val:', data[0].line_items || data[0].lineItems);
    } else {
        console.log('✅ Table exists but is empty.');
    }
}
checkTable();
