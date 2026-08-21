import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function cleanAmboLogs() {
    await supabase.auth.signInWithPassword({
        email: 'shukri.kamal@siifmart.com',
        password: 'Oromo123'
    });

    const amboSiteId = 'b2293359-9b3b-4468-9c2f-8a6e288791e3';

    console.log("=== CLEANING DUPLICATE MOVEMENT LOGS AT AMBO ===");

    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('site_id', amboSiteId);

    // Group by timestamp + product_id + quantity + reason
    const seen = new Set<string>();
    const idsToDelete: string[] = [];

    (movements || []).forEach(m => {
        const key = `${m.movement_date}_${m.product_id}_${m.type}_${m.quantity}_${m.reason}`;
        if (seen.has(key)) {
            idsToDelete.push(m.id);
        } else {
            seen.add(key);
        }
    });

    console.log(`Found ${idsToDelete.length} duplicate movement log entries at AMBO.`);

    for (const id of idsToDelete) {
        await supabase.from('stock_movements').delete().eq('id', id);
        console.log(`Deleted duplicate movement log ${id}`);
    }

    console.log("=== AMBO LOG CLEANUP COMPLETE ===");
}

cleanAmboLogs();
