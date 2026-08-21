import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function fixExactBalances() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== APPLYING EXACT PHYSICAL BALANCE AUDIT FOR BUNA TEA ===");

    // 1. Fix Job QEGW31 line item receivedQty = 20 (was 8000)
    const { data: qegw31 } = await supabase.from('wms_jobs').select('*').eq('job_number', 'QEGW31').eq('type', 'TRANSFER');
    if (qegw31 && qegw31.length > 0) {
        for (const j of qegw31) {
            const items = (j.line_items || j.lineItems || []).map((it: any) => {
                if (it.sku === 'PA0001' || (it.name && it.name.includes('Buna'))) {
                    return { ...it, expectedQty: 20, receivedQty: 20, received_qty: 20, pickedQty: 20, size: '400', unit: 'UNIT' };
                }
                return it;
            });
            await supabase.from('wms_jobs').update({ line_items: items }).eq('id', j.id);
            console.log(`Updated Transfer Job QEGW31 line item: receivedQty fixed from 8000 -> 20.`);
        }
    }

    // 2. Set Warehouse (Adama DC: 97452359-705d-44dd-b2de-1002d6c19a81) stock to 282
    const { error: whErr } = await supabase
        .from('products')
        .update({ stock: 282, unit: 'UNIT', size: '400', brand: 'Buna' })
        .eq('sku', 'PA0001')
        .eq('site_id', '97452359-705d-44dd-b2de-1002d6c19a81');
    console.log("Updated Warehouse (Adama DC) stock to 282:", whErr ? whErr.message : "Success");

    // 3. Set Bedeno Store (e1db6eda-6c54-476d-9669-e7bfe3749c30) stock to 20
    const { error: bedenoErr } = await supabase
        .from('products')
        .update({ stock: 20, unit: 'UNIT', size: '400', brand: 'Buna' })
        .eq('sku', 'PA0001')
        .eq('site_id', 'e1db6eda-6c54-476d-9669-e7bfe3749c30');
    console.log("Updated Bedeno store stock to 20:", bedenoErr ? bedenoErr.message : "Success");

    // 4. Set AMBO Store (b2293359-9b3b-4468-9c2f-8a6e288791e3) stock to 28
    const { error: amboErr } = await supabase
        .from('products')
        .update({ stock: 28, unit: 'UNIT', size: '400', brand: 'Buna' })
        .eq('sku', 'PA0001')
        .eq('site_id', 'b2293359-9b3b-4468-9c2f-8a6e288791e3');
    console.log("Updated AMBO store stock to 28:", amboErr ? amboErr.message : "Success");

    console.log("=== BUNA TEA AUDIT RECONCILIATION COMPLETE ===");
}

fixExactBalances();
