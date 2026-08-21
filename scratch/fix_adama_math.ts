import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== FIXING ADAMA DC STOCK (MATH CORRECTION) ===");

    // Fetch site IDs
    const { data: sites } = await supabase.from('sites').select('*');
    const adamaId = sites?.find(s => s.name.includes('Adama'))?.id;

    // Set Adama DC stock = 310 (30 + 300 received - 20 transferred to Bedeno)
    if (adamaId) {
        const { error: adamaErr } = await supabase
            .from('products')
            .update({ stock: 310, unit: 'UNIT', size: '400', brand: 'Buna' })
            .eq('sku', 'PA0001')
            .eq('site_id', adamaId);
        console.log("Updated Adama DC stock to 310 units:", adamaErr ? adamaErr.message : "Success");
    }

    console.log("=== FIX COMPLETE ===");
}

main();
