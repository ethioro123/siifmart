/**
 * Add PO Approval Columns Migration
 * Run this to add approved_by and approved_at columns to purchase_orders table
 */

import { supabase } from '../lib/supabase';

async function runMigration() {
    console.log('🚀 Adding approval columns to purchase_orders table...\n');

    try {
        // Since we can't run DDL directly via the client, we'll use the SQL editor approach
        // But first, let's check if the columns already exist
        const { data: testData, error: testError } = await supabase
            .from('purchase_orders')
            .select('approved_by, approved_at')
            .limit(1);

        if (!testError) {
            console.log('✅ Columns already exist! Migration not needed.\n');
            return;
        }

        // If we get here, columns don't exist
        console.log('⚠️  Columns do not exist. Please run this SQL in Supabase Dashboard:\n');
        console.log('---SQL START---');
        console.log(`
-- Add approval tracking columns to purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN approved_by VARCHAR(200),
ADD COLUMN approved_at TIMESTAMPTZ;

-- Add index for querying approved POs
CREATE INDEX idx_po_approved_at ON purchase_orders(approved_at);

-- Add comment for documentation
COMMENT ON COLUMN purchase_orders.approved_by IS 'Name of the person who approved the PO';
COMMENT ON COLUMN purchase_orders.approved_at IS 'Timestamp when the PO was approved';
        `);
        console.log('---SQL END---\n');

        const projectRef = process.env.VITE_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');
        console.log(`📍 Go to: https://supabase.com/dashboard/project/${projectRef}/sql`);
        console.log('   1. Click "New query"');
        console.log('   2. Copy the SQL above');
        console.log('   3. Paste and click "Run"\n');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

runMigration();
