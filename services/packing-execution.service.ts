import {z} from 'zod';
import {supabase} from '../lib/supabase';
import {mapWmsJobRow} from './wms-jobs.mapper';
export const packingExecutionService={
 async findCompleted(reference:string,siteId:string,country:string){
  z.string().uuid().parse(siteId);z.string().regex(/^[A-Z]{2}$/).parse(country);
  const ref=z.string().trim().regex(/^(?:[A-Za-z0-9]{6}|[0-9a-fA-F-]{36})$/).parse(reference);
  let query=supabase.from('wms_jobs').select('id').eq('site_id',siteId).eq('country_code',country).eq('type','PACK').eq('status','Completed');
  query=z.string().uuid().safeParse(ref).success?query.eq('id',ref):query.eq('job_number',ref.toUpperCase());
  const {data,error}=await query.limit(2);if(error)throw error;
  if(data?.length!==1)throw new Error('One completed Pack job could not be found at the selected facility.');return data[0].id as string;
 },async complete(jobId:string){
 z.string().uuid().parse(jobId);
 const {data,error}=await supabase.rpc('complete_pack_job',{p_job_id:jobId});
 if(error)throw error;
 if(data?.job?.id!==jobId||data.job.status!=='Completed'||!data?.dispatch?.id||data.dispatch.type!=='DISPATCH')throw new Error('Server did not confirm packing and dispatch handoff.');
 return {job:mapWmsJobRow(data.job),dispatch:mapWmsJobRow(data.dispatch)};
}};
