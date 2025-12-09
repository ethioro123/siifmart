import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetForTesting() {
    console.log('🔄 Resetting system for testing...\n');

    try {
        // 1. Reset all products to Receiving Dock with 0 stock
        console.log('📦 Resetting all products...');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*');

        if (productsError) throw productsError;

        for (const product of products || []) {
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    stock: 0,
                    location: 'Receiving Dock',
                    status: 'out_of_stock'
                })
                .eq('id', product.id);

            if (updateError) {
                console.error(`   ❌ Failed to reset product ${product.sku}:`, updateError.message);
            } else {
                console.log(`   ✅ Reset ${product.sku} - ${product.name}`);
            }
        }

        // 2. Reset all Purchase Orders to "Pending" status
        console.log('\n📋 Resetting all Purchase Orders...');
        const { data: pos, error: posError } = await supabase
            .from('purchase_orders')
            .select('*');

        if (posError) throw posError;

        for (const po of pos || []) {
            const { error: updateError } = await supabase
                .from('purchase_orders')
                .update({
                    status: 'Pending' // Valid statuses: Draft, Pending, Approved, Received, Cancelled
                })
                .eq('id', po.id);

            if (updateError) {
                console.error(`   ❌ Failed to reset PO ${po.po_number}:`, updateError.message);
            } else {
                console.log(`   ✅ Reset PO ${po.po_number} to Pending`);
            }
        }

        // 3. Delete all WMS Jobs
        console.log('\n🗑️  Deleting all WMS Jobs...');
        const { error: jobsError } = await supabase
            .from('wms_jobs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (jobsError) {
            console.error('   ❌ Failed to delete jobs:', jobsError.message);
        } else {
            console.log('   ✅ All WMS jobs deleted');
        }

        // 4. Delete all Job Assignments
        console.log('\n🗑️  Deleting all Job Assignments...');
        const { error: assignmentsError } = await supabase
            .from('job_assignments')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (assignmentsError) {
            console.error('   ❌ Failed to delete assignments:', assignmentsError.message);
        } else {
            console.log('   ✅ All job assignments deleted');
        }

        // 5. Reset all Transfers to Pending
        console.log('\n🚚 Resetting all Transfers...');
        const { data: transfers, error: transfersError } = await supabase
            .from('transfers')
            .select('*');

        if (transfersError) throw transfersError;

        for (const transfer of transfers || []) {
            const { error: updateError } = await supabase
                .from('transfers')
                .update({
                    status: 'Pending'
                })
                .eq('id', transfer.id);

            if (updateError) {
                console.error(`   ❌ Failed to reset transfer ${transfer.id}:`, updateError.message);
            } else {
                console.log(`   ✅ Reset transfer ${transfer.id.substring(0, 8)}... to Pending`);
            }
        }


        console.log('\n✅ System reset complete!\n');
        console.log('📝 Summary:');
        console.log(`   - ${products?.length || 0} products reset to Receiving Dock with 0 stock`);
        console.log(`   - ${pos?.length || 0} Purchase Orders reset to Pending`);
        console.log(`   - All WMS jobs deleted`);
        console.log(`   - All job assignments deleted`);
        console.log(`   - ${transfers?.length || 0} transfers reset to Pending`);
        console.log('\n🎯 You can now test the full workflow:');
        console.log('   1. Go to Procurement → Receive tab');
        console.log('   2. Receive a Purchase Order');
        console.log('   3. Go to WMS Operations → PUTAWAY tab');
        console.log('   4. Complete putaway jobs');
        console.log('   5. Products will appear in POS after putaway');

    } catch (error) {
        console.error('\n❌ Error during reset:', error);
        process.exit(1);
    }
}

resetForTesting();
