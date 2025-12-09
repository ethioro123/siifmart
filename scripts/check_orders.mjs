
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log('Checking Orders for Adama (97452359-705d-44dd-b2de-1002d6c19a81)...');

    const { data: orders } = await supabase
        .from('orders')
        .select('id, po_number, site_id, status, line_items')
        .eq('site_id', '97452359-705d-44dd-b2de-1002d6c19a81');

    if (orders) {
        console.log(`Found ${orders.length} orders.`);
        orders.forEach(o => {
            console.log(`- ${o.po_number} (${o.status}) - ${o.line_items?.length} items`);
        });
    } else {
        console.log('No orders found.');
    }
}

checkOrders();
