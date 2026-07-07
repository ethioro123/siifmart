import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkDiscrepancies() {
  const { data: jobs, error } = await supabase
    .from('wms_jobs')
    .select('*, lineItems:line_items')

  if (error) {
    console.error(error);
    return;
  }

  const discrepancies = jobs.filter((j: any) => 
    (j.lineItems || []).some((item: any) => 
      item.receivedQty !== undefined && 
      item.receivedQty !== item.expectedQty && 
      !['Resolved', 'Completed'].includes(item.status)
    )
  );

  console.log("Found", discrepancies.length, "discrepancies parsing line_items alias.");
  discrepancies.forEach((d: any) => {
     console.log(`- Job ID: ${d.id} | Type: ${d.type}`);
     console.log(`  Items:`, JSON.stringify(d.lineItems, null, 2));
  });
}

checkDiscrepancies();
