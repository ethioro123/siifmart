import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
// Replicate wmsJobsService logic exactly
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkFrontendLogic() {
  console.log("Fetching jobs exactly as the app does...");
  
  // 1. Fetch ALL Active Jobs
  let activeQuery = supabase
      .from('wms_jobs')
      .select('*')
      .not('status', 'in', '("Completed","Cancelled")')
      .order('created_at', { ascending: true }); // Oldest first
      
  // 2. Fetch Recent Historical Jobs
  let historyQuery = supabase
      .from('wms_jobs')
      .select('*')
      .in('status', ['Completed', 'Cancelled'])
      .order('updated_at', { ascending: false })
      .limit(500);

  const [activeRes, historyRes] = await Promise.all([activeQuery, historyQuery]);
  const combinedData = [...(activeRes.data || []), ...(historyRes.data || [])];
  
  const jobs = combinedData.map((j: any) => ({
      ...j,
      siteId: j.site_id,
      items: j.items_count,
      assignedTo: j.assigned_to,
      orderRef: j.order_ref,
      lineItems: j.line_items || [],
      jobNumber: j.job_number,
      sourceSiteId: j.source_site_id,
      destSiteId: j.dest_site_id,
      transferStatus: j.transfer_status,
      hasDiscrepancy: j.has_discrepancy,
      discrepancyDetails: j.discrepancy_details,
      completedBy: j.completed_by,
      completedAt: j.completed_at,
      notes: j.notes
  }));

  console.log(`Fetched ${jobs.length} total jobs.`);
  
  const discJobs = jobs.filter(j => j.type === 'TRANSFER' && (j.lineItems || []).some((item: any) => item.receivedQty !== undefined && item.receivedQty !== item.expectedQty && !['Resolved', 'Completed'].includes(item.status)));
  
  if (discJobs.length > 0) {
      console.log(`FOUND ${discJobs.length} DISCREPANCIES!`);
      discJobs.forEach(j => {
          console.log(`Job: ${j.id} | Job Number: ${j.jobNumber}`);
          j.lineItems.forEach((item: any) => {
              if (item.receivedQty !== undefined && item.receivedQty !== item.expectedQty && !['Resolved', 'Completed'].includes(item.status)) {
                  console.log(`  -> BAD ITEM: ${item.name} | expected: ${item.expectedQty} | received: ${item.receivedQty} | status: ${item.status}`);
              }
          });
      });
  } else {
      console.log("No discrepancies found even with exact app logic.");
  }
}

checkFrontendLogic();
