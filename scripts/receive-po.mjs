/**
 * Receive PO Script
 * Simulates receiving a PO and creating PUTAWAY jobs
 */

import { createClient } from '@supabase/supabase-js';

// Use the correct credentials from .env.local
const supabaseUrl = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDk5NDUsImV4cCI6MjA3OTM4NTk0NX0.UtK2N8PptKZn0Tqj0xWwbK1UxKRmp3UHESinI0OS2xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function receivePO() {
    console.log('📦 RECEIVE PO SCRIPT');
    console.log('====================\n');

    // 1. Find a Pending PO
    const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, po_items(*)')
        .eq('status', 'Pending')
        .limit(1);

    if (poError || !pos || pos.length === 0) {
        console.error('❌ No Pending POs found or error:', poError?.message);
        return;
    }

    const po = pos[0];
    console.log(`📍 Found PO: ${po.po_number} (${po.id})`);
    console.log(`   Site ID: ${po.site_id}`);
    console.log(`   Items: ${po.po_items.length}`);

    // 2. Update PO status to Received
    const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: 'Received' })
        .eq('id', po.id);

    if (updateError) {
        console.error('❌ Failed to update PO status:', updateError.message);
        return;
    }
    console.log('✅ PO status updated to Received');

    // 3. Create PUTAWAY Job
    // Check if job already exists
    const { data: existingJobs } = await supabase
        .from('wms_jobs')
        .select('*')
        .eq('order_ref', po.id)
        .neq('status', 'Completed');

    if (existingJobs && existingJobs.length > 0) {
        console.log('⚠️ Valid jobs already exist for this PO. Skipping job creation.');
        return;
    }

    // Create job items from PO items
    const jobItems = po.po_items.map(item => ({
        productId: item.product_id, // Might be null, handled in PUTAWAY logic
        productName: item.product_name,
        sku: item.sku || `PO-${Date.now()}`, // Fallback if sku missing
        expectedQty: item.quantity,
        scannedQty: 0,
        status: 'pending'
    }));

    const newJob = {
        site_id: po.site_id,
        type: 'PUTAWAY',
        status: 'Pending',
        priority: 'Normal',
        order_ref: po.id,
        line_items: jobItems, // Supabase handles JSONB conversion
        items_count: jobItems.length,
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data: job, error: jobError } = await supabase
        .from('wms_jobs')
        .insert(newJob)
        .select()
        .single();

    if (jobError) {
        console.error('❌ Failed to create PUTAWAY job:', jobError.message);
        return;
    }

    console.log(`✅ Created PUTAWAY Job: ${job.id}`);
    console.log(`   Type: ${job.type}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Items: ${job.line_items.length}`);
}

receivePO().catch(console.error);
