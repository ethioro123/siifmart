import { supabase } from '../lib/supabase';
export const packVerificationService = {
    async excludedWorkers(packJobId:string):Promise<string[]> {
        const {data,error}=await supabase.rpc('pack_excluded_workers',{p_pack_job_id:packJobId});
        if(error)throw error;
        if(!Array.isArray(data)||data.some(id=>typeof id!=='string'))throw new Error('Independent packing eligibility could not be confirmed.');
        return data;
    }
};
