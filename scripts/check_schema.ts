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

async function checkSchema() {
    console.log('Checking purchase_orders ID type...');

    // Try to insert a PO with text ID
    const testId = 'TEST-ID';
    const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
            id: testId,
            site_id: (await supabase.from('sites').select('id').limit(1)).data?.[0]?.id,
            status: 'Draft',
            total_amount: 0,
            items_count: 0
        })
        .select();

    if (error) {
        console.error('❌ Error inserting PO:', error.message);
        if (error.message.includes('invalid input syntax for type uuid')) {
            console.log('🚨 DIAGNOSIS: purchase_orders.id is UUID, but we are sending TEXT.');
        }
    } else {
        console.log('✅ Success! purchase_orders.id accepts TEXT.');
        // Cleanup
        await supabase.from('purchase_orders').delete().eq('id', testId);
    }
}

checkSchema();
