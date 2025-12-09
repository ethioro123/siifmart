import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function reverseReceivedToApproved() {
    console.log('🔄 Reversing Received POs back to Approved...');

    // Find all Received POs
    const { data: receivedPOs, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('status', 'Received');

    if (fetchError) {
        console.error('❌ Failed to fetch POs:', fetchError);
        return;
    }

    if (!receivedPOs || receivedPOs.length === 0) {
        console.log('ℹ️  No Received POs found.');
        return;
    }

    console.log(`📋 Found ${receivedPOs.length} Received PO(s)`);

    for (const po of receivedPOs) {
        // Update status back to Pending (Approved in frontend)
        // Keep or add approval tag in notes
        let notes = po.notes || '';
        if (!notes.includes('[APPROVED_BY:')) {
            notes = `[APPROVED_BY:System:${new Date().toISOString()}] ${notes}`.trim();
        }

        const { error: updateError } = await supabase
            .from('purchase_orders')
            .update({
                status: 'Pending',
                notes: notes
            })
            .eq('id', po.id);

        if (updateError) {
            console.error(`❌ Failed to update PO ${po.po_number}:`, updateError);
        } else {
            console.log(`✅ Reversed PO ${po.po_number} to Approved`);
        }
    }

    console.log('🎉 All Received POs have been reversed to Approved!');
    console.log('👉 Refresh your browser to see the changes.');
}

reverseReceivedToApproved();
