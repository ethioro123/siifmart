import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    console.log("=== UPDATING BUNA TEA STOCK TO 20 UNITS (400g PACK) IN SUPABASE ===");

    // Update all Buna Tea records (PA0001) in DB to stock = 20, unit = 'UNIT', size = '400'
    const { data: updated, error } = await supabase
        .from('products')
        .update({
            stock: 20,
            unit: 'UNIT',
            size: '400',
            brand: 'Buna',
            custom_attributes: {
                physical: { netWeight: '400', sizeType: 'g', unit: 'g' },
                packaging: { packQty: '1' },
                commercial: { sellBy: 'Unit', sellUnit: 'UNIT' }
            }
        })
        .eq('sku', 'PA0001')
        .select('id, name, sku, stock, unit, size, site_id');

    if (error) {
        console.error("Failed to update Buna Tea stock:", error);
    } else {
        console.log(`SUCCESS: Updated ${updated?.length || 0} Buna Tea product records in database:`);
        console.log(JSON.stringify(updated, null, 2));
    }
}

main();
