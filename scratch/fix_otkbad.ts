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

    // Fetch OTKBAD from transfers table
    const { data: transfers, error: tErr } = await supabase
        .from('transfers')
        .select('*')
        .or('job_number.ilike.%OTKBAD%,id.ilike.%OTKBAD%,order_ref.ilike.%OTKBAD%');

    console.log("OTKBAD in transfers table:", JSON.stringify(transfers, null, 2));

    if (transfers && transfers.length > 0) {
        for (const t of transfers) {
            console.log(`Resetting transfer ID ${t.id}: status=${t.status}, transfer_status=${t.transfer_status}`);
            await supabase
                .from('transfers')
                .update({
                    status: 'In-Progress',
                    transfer_status: 'Delivered',
                    received_at: null,
                    received_by: null
                })
                .eq('id', t.id);
            console.log(`✅ Reset transfer ID ${t.id} in transfers table!`);
        }
    } else {
        // Query recent records in transfers table
        const { data: recentT } = await supabase
            .from('transfers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        console.log("Recent transfers table records:", JSON.stringify(recentT, null, 2));
    }
}

main().catch(console.error);
