import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const tables = [
        'wms_jobs',
        'job_assignments',
        'orders',
        'purchase_orders',
        'fulfillment_orders',
        'inventory_requests',
        'transfers',
        'stock_movements',
        'sales_orders',
        'pick_jobs',
        'pack_jobs'
    ];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(100);
            if (error) {
                // Table might not exist, ignore
                continue;
            }
            const str = JSON.stringify(data).toLowerCase();
            if (str.includes('961c') || str.includes('b0be') || str.includes('pan-ric-001')) {
                console.log(`🎯 FOUND MATCH IN TABLE '${table}'! Items count: ${data?.length}`);
                data?.forEach((row: any) => {
                    const rowStr = JSON.stringify(row).toLowerCase();
                    if (rowStr.includes('961c') || rowStr.includes('b0be') || rowStr.includes('pan-ric-001')) {
                        console.log(`  Row ID: ${row.id || row.order_id || row.job_id} | ${JSON.stringify(row).substring(0, 150)}`);
                    }
                });
            }
        } catch (e) {}
    }
}

main();
