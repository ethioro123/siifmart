
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
    console.log('--- Checking wms_jobs columns ---');
    const { data, error } = await supabase.from('wms_jobs').select('*').limit(1);
    if (error) {
        console.log('❌ Error fetching wms_jobs:', error.message);
    } else {
        console.log('✅ Connected to wms_jobs');
        if (data && data.length > 0) {
            console.log('Current Columns:', Object.keys(data[0]));
            if (Object.keys(data[0]).includes('external_carrier_name')) {
                console.log('✓ external_carrier_name exists');
            } else {
                console.log('✗ external_carrier_name MISSING');
            }
            if (Object.keys(data[0]).includes('delivery_method')) {
                console.log('✓ delivery_method exists');
            } else {
                console.log('✗ delivery_method MISSING');
            }
        } else {
            // Force error to see columns if empty
            const { error: insertError } = await supabase.from('wms_jobs').insert({ 'DEBUG_FORCE_ERROR': 1 });
            console.log('Column hint error:', insertError?.message);
        }
    }
}
check();
