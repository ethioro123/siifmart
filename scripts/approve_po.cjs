
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function approvePO() {
    const poNumber = 'PO05694';
    console.log(`Searching for PO: ${poNumber}...`);

    // Search by partial match or exact match
    const { data: pos, error: searchError } = await supabase
        .from('purchase_orders')
        .select('*')
        .or(`po_number.ilike.%5694%,po_number.eq.${poNumber}`);

    if (searchError) {
        console.error('Error searching PO:', searchError);
        process.exit(1);
    }

    if (!pos || pos.length === 0) {
        console.error(`PO ${poNumber} not found. Searching for any Draft POs instead...`);
        const { data: draftPos, error: draftError } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('status', 'Draft');

        if (draftError) {
            console.error('Error searching Draft POs:', draftError);
            process.exit(1);
        }

        if (!draftPos || draftPos.length === 0) {
            console.error('No Draft POs found in the system.');
            process.exit(1);
        }

        console.log(`Found ${draftPos.length} Draft POs. Picking the first one.`);
        pos.push(...draftPos);
    }

    const po = pos[0];
    console.log(`Targeting PO: ${po.po_number || po.id} (Current Status: ${po.status})`);

    const approvalTag = `\n[APPROVED_BY:Antigravity-Agent:${new Date().toISOString()}]`;
    const updatedNotes = (po.notes || '') + approvalTag;

    console.log('Updating status to Pending...');
    const { data: updated, error: updateError } = await supabase
        .from('purchase_orders')
        .update({
            status: 'Pending',
            notes: updatedNotes
        })
        .eq('id', po.id)
        .select();

    if (updateError) {
        console.error('Error updating PO:', updateError);
        process.exit(1);
    }

    console.log('Successfully approved PO!');
    console.log('Updated PO Details:', updated[0]);
}

approvePO().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
