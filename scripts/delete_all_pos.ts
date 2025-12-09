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

async function deleteAllPOs() {
    console.log('🗑️  Deleting all Purchase Orders...\n');

    try {
        // First, get count of existing POs
        const { count: poCount } = await supabase
            .from('purchase_orders')
            .select('*', { count: 'exact', head: true });

        console.log(`Found ${poCount} purchase orders to delete\n`);

        if (poCount === 0) {
            console.log('✅ No purchase orders to delete.\n');
            return;
        }

        // Confirm deletion
        console.log('⚠️  This will delete:');
        console.log(`   - ${poCount} purchase orders`);
        console.log('   - All associated PO items (line items)\n');

        // Delete all PO items first (due to foreign key constraint)
        console.log('Deleting PO items...');
        const { error: itemsError } = await supabase
            .from('po_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)

        if (itemsError) {
            console.error('❌ Error deleting PO items:', itemsError);
            throw itemsError;
        }

        console.log('✅ All PO items deleted\n');

        // Delete all purchase orders
        console.log('Deleting purchase orders...');
        const { error: poError } = await supabase
            .from('purchase_orders')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (poError) {
            console.error('❌ Error deleting purchase orders:', poError);
            throw poError;
        }

        console.log('✅ All purchase orders deleted\n');

        // Verify deletion
        const { count: remainingCount } = await supabase
            .from('purchase_orders')
            .select('*', { count: 'exact', head: true });

        console.log('📊 Final Status:');
        console.log(`   - Deleted: ${poCount} POs`);
        console.log(`   - Remaining: ${remainingCount} POs`);
        console.log('\n🎉 Cleanup complete!\n');

    } catch (err: any) {
        console.error('\n❌ Error during cleanup:', err.message);
        process.exit(1);
    }
}

deleteAllPOs();
