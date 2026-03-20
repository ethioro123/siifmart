import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Mimic filterBySite from locationAccess.ts
const filterBySite = (data: any[], role: string, siteId: string) => {
    if (['super_admin', 'CEO', 'Admin', 'super_admin'].includes(role)) return data;
    if (['operations_manager', 'regional_manager', 'Auditor'].includes(role)) return data;
    
    return data.filter(item => {
        const itemSiteId = item.siteId || item.site_id;
        const itemDestSiteId = item.destSiteId || item.dest_site_id;
        
        return itemSiteId === siteId || itemDestSiteId === siteId;
    });
};

config({ path: '.env.local' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkFrontendLogic() {
  const { data: rawJobs, error } = await supabase.from('wms_jobs').select('*');
  if (error) { console.error(error); return; }

  // Map to frontend structure
  const jobs = rawJobs.map((j: any) => ({
      ...j,
      siteId: j.site_id,
      destSiteId: j.dest_site_id,
      lineItems: j.line_items || []
  }));

  // Mimic CEO selecting AMBO (SITE-0008)
  const amboSiteId = '39f60bc9-53e3-4623-bc97-5a04eb81c1c7'; // Assuming this from previous queries
  
  // Actually, CEO sees ALL if activeSite logic isn't strictly pruning.
  // Wait, useFilteredFulfillmentData says:
  // if (user?.role === 'super_admin' && activeSite ...) pruned = base.filter(site == activeSite)
  
  // Let's just find ANY job that has a discrepancy in lineItems
  const allDiscrepancies = jobs.filter(j => j.type === 'TRANSFER' && 
      (j.lineItems || []).some((item: any) => 
          item.receivedQty !== undefined && 
          item.receivedQty !== item.expectedQty && 
          !['Resolved', 'Completed'].includes(item.status)
      )
  );

  console.log(`Found ${allDiscrepancies.length} TRANSFER jobs with discrepancies using frontend logic mapping.`);
  
  if (allDiscrepancies.length === 0) {
      console.log(`Searching ALL job types for discrepancies...`);
      const allTypes = jobs.filter(j => 
          (j.lineItems || []).some((item: any) => 
              item.receivedQty !== undefined && 
              item.receivedQty !== item.expectedQty && 
              !['Resolved', 'Completed'].includes(item.status)
          )
      );
      console.log(`Found ${allTypes.length} across ALL TYPES.`);
  }

}

checkFrontendLogic();
