import { supabase } from '../lib/supabase';
const FLOOR_STAGES = new Set(['RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS']);
export const isIndependentFloorStage = (type:string) => FLOOR_STAGES.has(type);
export const floorStageVerificationService = {
    async excludedWorkers(jobId:string):Promise<string[]> {
        const {data,error}=await supabase.rpc('floor_stage_excluded_workers',{p_job_id:jobId});
        if(error)throw error;
        if(!Array.isArray(data)||data.some(id=>typeof id!=='string'))throw new Error('Independent worker eligibility could not be confirmed.');
        return data;
    }
};
