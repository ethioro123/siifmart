
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('🔍 CURRENT STATE CHECK...\n');

    // Jobs count
    const { count: jobCount } = await supabase.from('wms_jobs').select('*', { count: 'exact', head: true });
    console.log(`📋 Total WMS Jobs: ${jobCount}`);

    // Products count  
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`📦 Total Products: ${prodCount}`);

    // Recent jobs
    const { data: jobs } = await supabase
        .from('wms_jobs')
        .select('job_number, status, type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n📋 Latest 5 Jobs:');
    jobs?.forEach(j => console.log(`  - ${j.job_number} | ${j.type} | ${j.status} | ${j.created_at}`));

    // Check for Approved POs
    const { data: pos } = await supabase
        .from('purchase_orders')
        .select('po_number, status')
        .eq('status', 'Approved');

    console.log(`\n✅ Approved POs ready for receiving: ${pos?.length || 0}`);
    pos?.forEach(p => console.log(`  - ${p.po_number}`));
}

checkState();
