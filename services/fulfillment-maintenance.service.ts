import {supabase} from '../lib/supabase';
export const fulfillmentMaintenanceService={
 async run(site:string,country:string,action:'reset'|'cancel'|'reconcile',job?:string):Promise<number>{
  if(!site||!country)throw new Error('Facility and country required');
  const {data,error}=await supabase.rpc('maintain_fulfillment_jobs',{p_site:site,p_country:country,p_action:action,p_job:job||null});
  if(error)throw error;if(!data?.saved||!Number.isInteger(data.changed))throw new Error('Maintenance was not confirmed');return data.changed;
 }
};
