import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkxdvbkzfxcjwqnkwgqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreGR2Ymt6Znhjandxbmt3Z3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NTQ1NTEsImV4cCI6MjA0ODAzMDU1MX0.sSKHiMYKNVhLMlGtXCXZXtKMOPgKmJDnCcPfDKLpv3M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPOApprovals() {
    console.log('🔍 Checking Purchase Orders for auto-approval issues...\n');

    // Get all POs
    const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, status, approved_by, approved_at, notes, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching POs:', error);
        return;
    }

    console.log(`Found ${pos.length} Purchase Orders\n`);

    let autoApprovedCount = 0;
    const autoApprovedPOs: any[] = [];

    for (const po of pos) {
        // Check if PO is marked as Pending (which should be Draft) but has approval info
        if (po.status === 'Pending' && po.approved_by) {
            autoApprovedCount++;
            autoApprovedPOs.push(po);
            console.log(`⚠️  PO ${po.po_number || po.id.slice(0, 8)}`);
            console.log(`   Status: ${po.status}`);
            console.log(`   Approved By: ${po.approved_by}`);
            console.log(`   Approved At: ${po.approved_at}`);
            console.log(`   Created: ${po.created_at}`);
            console.log('');
        }
    }

    if (autoApprovedCount === 0) {
        console.log('✅ No auto-approved POs found! All POs are correctly set as Draft.');
    } else {
        console.log(`\n📊 Summary: ${autoApprovedCount} POs have approval data but should be Draft\n`);
        console.log('Would you like to clear the approval data? (This will make them show as Draft)');
        console.log('Run: npm run fix-po-approvals');
    }
}

checkPOApprovals();
