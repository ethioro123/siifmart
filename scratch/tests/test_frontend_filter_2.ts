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

  // Finding AMBO transfers to see what data looks like, just grabbing 2 of them
  const amboSiteId = '39f60bc9-53e3-4623-bc97-5a04eb81c1c7'; 
  const amboTransfers = rawJobs.filter(j => 
    j.type === 'TRANSFER' && (j.site_id === amboSiteId || j.dest_site_id === amboSiteId)
  );

  console.log("Analyzing 2 AMBO transfers for structure...");
  amboTransfers.slice(0, 2).forEach(t => {
      console.log(`Job ${t.job_number} | Status: ${t.status} | Transfer: ${t.transfer_status}`);
      console.log(`Line Items:`, JSON.stringify(t.line_items, null, 2));
  });

  // Since exact matching failed earlier, let's output EVERY job's received vs expected Qty
  console.log("\nDeep searching every single item in every single transfer...");
  let potentialHits = 0;
  rawJobs.filter(j => j.type === 'TRANSFER').forEach(j => {
      (j.line_items || []).forEach((item: any) => {
          if (item.receivedQty !== undefined) {
              if (item.receivedQty !== item.expectedQty && item.status !== 'Resolved' && item.status !== 'Completed') {
                  console.log(`FOUND MISMATCH -> Job: ${j.id} | expected: ${item.expectedQty} | received: ${item.receivedQty} | status: ${item.status}`);
                  potentialHits++;
              }
          }
      });
  });
  console.log(`Deep search completed. Hits: ${potentialHits}`);
}

checkFrontendLogic();
