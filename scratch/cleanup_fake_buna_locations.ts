import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== REMOVING UNVERIFIED BUNA TEA LOCATIONS ===");

    // Delete Harar Logistics Hub (8e5ef26f-2023-4b1b-8bf8-1b9701d96163)
    const { error: err1 } = await supabase.from('products').delete().eq('id', '8e5ef26f-2023-4b1b-8bf8-1b9701d96163');
    console.log("Deleted Harar Logistics Hub test row:", err1 ? err1.message : "Success");

    // Delete Merkato retail store (7a1f3e98-d34a-4b13-94c7-b724b976a31b)
    const { error: err2 } = await supabase.from('products').delete().eq('id', '7a1f3e98-d34a-4b13-94c7-b724b976a31b');
    console.log("Deleted Merkato retail store test row:", err2 ? err2.message : "Success");

    console.log("=== CLEANUP COMPLETE ===");
}

main();
