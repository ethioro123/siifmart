const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://zdgzpxvorwinugjufkvb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3pweHZvcndpbnVnanVma3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwOTk0NSwiZXhwIjoyMDc5Mzg1OTQ1fQ.toS8r1CEPIhV6gddpKNRgjTY_IDfWEJODNnCxu_78KQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ID Generators
function generateSequentialId(prefix) {
    const randomNum = Math.floor(Math.random() * 99999) + 1;
    const paddedNum = randomNum.toString().padStart(5, '0');
    return `${prefix}${paddedNum}`;
}

async function runMigration() {
    console.log('🚀 Starting Migration with Service Role Key...');

    // 1. Purchase Orders
    console.log('\n🔄 Migrating Purchase Orders...');
    const { data: orders, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, po_number')
        .is('po_number', null);

    if (poError) console.error('Error fetching POs:', poError.message);
    else if (orders && orders.length > 0) {
        for (const order of orders) {
            const newId = generateSequentialId('PO');
            await supabase
                .from('purchase_orders')
                .update({ po_number: newId })
                .eq('id', order.id);
            console.log(`✅ Updated PO: ${newId}`);
        }
    } else {
        console.log('✅ All POs already have friendly IDs');
    }

    // 2. Sales
    console.log('\n🔄 Migrating Sales...');
    // Check if receipt_number column exists by trying to select it
    const { data: sales, error: saleError } = await supabase
        .from('sales')
        .select('id, receipt_number') // Trying snake_case
        .is('receipt_number', null);

    if (saleError) {
        console.error('Error fetching Sales (receipt_number might be missing):', saleError.message);
    } else if (sales && sales.length > 0) {
        for (const sale of sales) {
            const newId = generateSequentialId('S');
            await supabase
                .from('sales')
                .update({ receipt_number: newId })
                .eq('id', sale.id);
            console.log(`✅ Updated Sale: ${newId}`);
        }
    } else {
        console.log('✅ All Sales already have friendly IDs');
    }

    // 3. Warehouse Jobs
    console.log('\n🔄 Migrating Warehouse Jobs (wms_jobs)...');
    const { data: jobs, error: jobError } = await supabase
        .from('wms_jobs') // Correct table name
        .select('id, job_number, type') // Trying snake_case
        .is('job_number', null);

    if (jobError) {
        console.error('Error fetching Jobs (job_number might be missing):', jobError.message);
    } else if (jobs && jobs.length > 0) {
        for (const job of jobs) {
            const prefix = job.type === 'JOB' ? 'J' : (job.type ? job.type.charAt(0) : 'J');
            const newId = generateSequentialId(prefix);
            await supabase
                .from('wms_jobs')
                .update({ job_number: newId })
                .eq('id', job.id);
            console.log(`✅ Updated Job: ${newId}`);
        }
    } else {
        console.log('✅ All Jobs already have friendly IDs');
    }

    console.log('\n✨ Migration Complete!');
}

runMigration().catch(console.error);
