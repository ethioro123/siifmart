import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth active:", !!authRes.data.session);

    // Test calling pos_decrement_stock
    const { data, error } = await supabase.rpc('pos_decrement_stock', {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_quantity: 0,
        p_site_id: 'test',
        p_product_name: 'test'
    });

    console.log("RPC test result:", { data, error });
}

main().catch(console.error);
