import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkFrontendLogic() {
  const { data: rawJobs, error } = await supabase.from('wms_jobs').select('*');
  if (error) { console.error(error); return; }

  let nullHits = 0;
  let definedHits = 0;

  console.log("Deep searching null values vs defined values...");
  rawJobs.filter(j => j.type === 'TRANSFER').forEach(j => {
      (j.line_items || []).forEach((item: any) => {
          if (item.receivedQty === null && item.expectedQty !== null) {
              nullHits++;
              console.log(`[NULL HIT] Job: ${j.id} | expected: ${item.expectedQty} | received: ${item.receivedQty} | status: ${item.status}`);
          } else if (item.receivedQty !== undefined && item.receivedQty !== item.expectedQty && !['Resolved', 'Completed'].includes(item.status)) {
              definedHits++;
              console.log(`[DEFINED HIT] Job: ${j.id} | expected: ${item.expectedQty} | received: ${item.receivedQty} | status: ${item.status}`);
          }
      });
  });
  console.log(`Search completed. Null Hits: ${nullHits}. Defined Hits: ${definedHits}`);
}

checkFrontendLogic();
