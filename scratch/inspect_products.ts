import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    const authRes = await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });
    console.log("Auth session active:", !!authRes.data.session);

    const ids = ['dd2e4b80-e7a0-42f8-b4fe-923cc03716c2', '0d7bac3c-e20a-4be8-963a-23d9b099cb5d'];
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids);

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log("Products details:");
    console.log(JSON.stringify(products, null, 2));
}
main();
