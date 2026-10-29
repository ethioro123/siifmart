import { supabase } from '../lib/supabase';
import type { WMSJob } from '../types';
export const receivingTransactionService={
 async save(request:string,po:string,item:string,previous:number,jobs:Array<Omit<WMSJob,'id'>>){
  const {data,error}=await supabase.rpc('save_receiving_split',{p_request:request,p_po:po,p_item:item,p_jobs:jobs,p_previous:previous});if(error)throw error;
  if(!data?.saved||!Array.isArray(data.jobIds)||data.jobIds.length!==jobs.length)throw new Error('Receipt transaction was not confirmed');
  // Server creates all operational data atomically; construct only confirmed rows for the immediate local view.
  return data.jobIds.map((id:string,index:number)=>({...jobs[index],id})) as WMSJob[];
 }
};
