import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function findDiscrepancies() {
  const { data: jobs, error } = await supabase
    .from('wms_jobs')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  // Filter for ANY job where expected vs received mismatch
  const discrepancies = jobs.filter(j => 
    (j.lineItems || []).some((item: any) => 
      item.receivedQty !== undefined && 
      item.receivedQty !== item.expectedQty && 
      !['Resolved', 'Completed'].includes(item.status)
    )
  );

  console.log("Found", discrepancies.length, "discrepant jobs in TOTAL:");
  discrepancies.forEach(d => {
     console.log(`- Job ID: ${d.id} | Type: ${d.type} | Job Number: ${d.jobNumber}`);
     console.log(`  Items:`, JSON.stringify(d.lineItems, null, 2));
  });
}

findDiscrepancies();
