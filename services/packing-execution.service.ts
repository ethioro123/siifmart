import {z} from 'zod';
import {supabase} from '../lib/supabase';
import {mapWmsJobRow} from './wms-jobs.mapper';
export const packingExecutionService={async complete(jobId:string){
 z.string().uuid().parse(jobId);
 const {data,error}=await supabase.rpc('complete_pack_job',{p_job_id:jobId});
 if(error)throw error;
 if(data?.job?.id!==jobId||data.job.status!=='Completed'||!data?.dispatch?.id||data.dispatch.type!=='DISPATCH')throw new Error('Server did not confirm packing and dispatch handoff.');
 return {job:mapWmsJobRow(data.job),dispatch:mapWmsJobRow(data.dispatch)};
}};
