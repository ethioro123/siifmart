import {supabase} from '../lib/supabase';
export const blindReceivingService={
 async jobs(siteId:string,country?:string){
  if(!siteId)return [];
  let q=supabase.from('blind_receiving_wms').select('*').eq('dest_site_id',siteId).order('created_at').limit(200);
  if(country)q=q.eq('country_code',country);
  const {data,error}=await q;if(error)throw error;return data||[];
 },
 async transfers(siteId:string,country?:string){
  if(!siteId)return [];
  let q=supabase.from('blind_receiving_transfers').select('*').eq('dest_site_id',siteId).order('created_at').limit(200);
  if(country)q=q.eq('country_code',country);
  const {data,error}=await q;if(error)throw error;return data||[];
 }
};
