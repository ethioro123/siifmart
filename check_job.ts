import { config } from 'dotenv';
config({ path: '.env' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: jobs } = await supabase.from('wms_jobs').select('*').eq('jobNumber', 'DFF20F');
  if (jobs && jobs.length > 0) {
    const job = jobs[0];
    console.log('Job:', JSON.stringify(job, null, 2));
    if (job.lineItems && job.lineItems.length > 0) {
      const item = job.lineItems[0];
      const { data: products } = await supabase.from('products').select('*').eq('sku', item.sku).eq('site_id', job.site_id);
      console.log('Product details:', JSON.stringify(products, null, 2));
    }
  } else {
    // Try by ID if jobNumber is not DFF20F
    const { data: jobsById } = await supabase.from('wms_jobs').select('*').ilike('id', '%DFF20F%');
    console.log('Jobs by ID match:', JSON.stringify(jobsById, null, 2));
  }
}
check();
