
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking wms_jobs table columns...');

    // We can't easily query information_schema via JS client without admin/rpc, 
    // but we can try to select * limit 1 and see the keys returned, OR try to insert a dummy row and catch the error.

    // Attempt 1: Check existing data keys
    const { data, error } = await supabase
        .from('wms_jobs')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching wms_jobs:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found wms_jobs columns based on existing row:');
        console.log(Object.keys(data[0]).sort().join('\n'));
    } else {
        console.log('⚠️ No rows in wms_jobs. Cannot infer columns from data.');
        // If no data, we can't be sure, but we can try to insert and see if it fails on "column does not exist"
    }
}

checkSchema();
