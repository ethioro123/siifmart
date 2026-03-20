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

  let strictHits = 0;
  let looseHits = 0;

  console.log("Deep searching types vs values...");
  rawJobs.filter(j => j.type === 'TRANSFER').forEach(j => {
      (j.line_items || []).forEach((item: any) => {
          if (item.receivedQty !== undefined && item.status !== 'Resolved' && item.status !== 'Completed') {
              
              // Loose equality
              if (item.receivedQty != item.expectedQty) {
                  looseHits++;
                  console.log(`[LOOSE] Job: ${j.id} | expected: ${item.expectedQty} (${typeof item.expectedQty}) | received: ${item.receivedQty} (${typeof item.receivedQty})`);
              }
              
              // Strict equality ONLY difference
              if (item.receivedQty !== item.expectedQty && item.receivedQty == item.expectedQty) {
                  strictHits++;
                  console.log(`[STRICT ONLY] Job: ${j.id} | expected: ${item.expectedQty} (${typeof item.expectedQty}) | received: ${item.receivedQty} (${typeof item.receivedQty})`);
              }
          }
      });
  });
  console.log(`Search completed. Loose Hits (Real Mismatch): ${looseHits}. Strict Hits (Type Mismatch): ${strictHits}`);
}

checkFrontendLogic();
