
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateTransfer() {
    console.log('🧪 Testing Transfer Creation...');

    // 1. Get valid sites
    const { data: sites, error: siteError } = await supabase.from('sites').select('id').limit(2);
    if (siteError || !sites || sites.length < 2) {
        console.error('❌ Failed to get sites:', siteError);
        return;
    }
    const sourceSiteId = sites[0].id;
    const destSiteId = sites[1].id;

    // 2. Get valid product
    const { data: products, error: prodError } = await supabase.from('products').select('id, sku, name').limit(1);
    if (prodError || !products || products.length === 0) {
        console.error('❌ Failed to get products:', prodError);
        return;
    }
    const product = products[0];

    console.log(`ℹ️ Sites: ${sourceSiteId} -> ${destSiteId}`);
    console.log(`ℹ️ Product: ${product.id}`);

    // 3. Attempt to create transfer job
    const jobData = {
        site_id: sourceSiteId,
        source_site_id: sourceSiteId,
        dest_site_id: destSiteId,
        type: 'TRANSFER',
        status: 'Pending',
        priority: 'Normal',
        location: 'Transfer',
        job_number: `JOB-TEST-${Date.now()}`,
        items_count: 1,
        line_items: [{
            productId: product.id,
            sku: product.sku,
            name: product.name,
            expectedQty: 5,
            pickedQty: 0,
            status: 'Pending'
        }],
        order_ref: new Date().toISOString(),
        transfer_status: 'Requested',
        requested_by: 'Test Script'
    };

    const { data: job, error: createError } = await supabase
        .from('wms_jobs')
        .insert(jobData)
        .select()
        .single();

    if (createError) {
        console.error('❌ Creation Failed! Error details:');
        console.error(JSON.stringify(createError, null, 2));
    } else {
        console.log('✅ Transfer Job Created Successfully:', job.id);

        // Clean up
        await supabase.from('wms_jobs').delete().eq('id', job.id);
        console.log('🧹 Cleaned up test job');
    }
}

testCreateTransfer();
