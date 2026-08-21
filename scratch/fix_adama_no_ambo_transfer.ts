import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== FIXING ADAMA DC & BEDENO TRANSFER SITES ===");

    // Fetch site IDs
    const { data: sites } = await supabase.from('sites').select('*');
    const adamaId = sites?.find(s => s.name.includes('Adama'))?.id;
    const bedenoId = sites?.find(s => s.name.includes('BEDENO'))?.id;

    // 1. Ensure Job QEGW31 has from_site_id = Adama DC, to_site_id = BEDENO
    if (adamaId && bedenoId) {
        const { error: jobErr } = await supabase
            .from('wms_jobs')
            .update({
                from_site_id: adamaId,
                to_site_id: bedenoId
            })
            .eq('job_number', 'QEGW31');
        console.log("Set Job QEGW31 sites (Adama DC -> BEDENO):", jobErr ? jobErr.message : "Success");
    }

    // 2. Set Adama DC stock = 280 (300 received - 20 transferred to Bedeno)
    const { error: adamaErr } = await supabase
        .from('products')
        .update({ stock: 280, unit: 'UNIT', size: '400', brand: 'Buna' })
        .eq('sku', 'PA0001')
        .eq('site_id', adamaId);
    console.log("Updated Adama DC stock to 280 units:", adamaErr ? adamaErr.message : "Success");

    console.log("=== FIX COMPLETE ===");
}

main();
