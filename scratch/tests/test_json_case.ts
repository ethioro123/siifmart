import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkLogic() {
  const { data: rawJobs } = await supabase.from('wms_jobs').select('*');
  let hits = 0;
  rawJobs?.forEach(j => {
      if (j.type !== 'TRANSFER') return;
      (j.line_items || []).forEach((item: any) => {
          if (item.receivedQty !== undefined && item.receivedQty !== item.expectedQty) {
              const isResolved = ['Resolved', 'Completed'].includes(item.status);
              const isResolvedCaseInsensitive = ['resolved', 'completed'].includes((item.status || '').toLowerCase());
              
              if (!isResolved && isResolvedCaseInsensitive) {
                  hits++;
                  console.log(`[CASE ISSUE] Job: ${j.id} | Status is ${item.status}`);
              } else if (!isResolved) {
                  console.log(`[REAL DISCREPANCY] Job: ${j.id} | Status: ${item.status} | Exp: ${item.expectedQty} | Rec: ${item.receivedQty}`);
              }
          }
      });
  });
  console.log(`Finished. Found ${hits} case-sensitivity issues.`);
}

checkLogic();
