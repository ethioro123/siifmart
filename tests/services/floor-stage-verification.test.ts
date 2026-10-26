import { beforeEach, expect, it, vi } from 'vitest';
import { floorStageVerificationService } from '../../services/floor-stage-verification.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
it('uses server picker attribution rather than only loaded active jobs',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:['picker'],error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 expect(await floorStageVerificationService.excludedWorkers('pack')).toEqual(['picker']);
 expect(supabase.rpc).toHaveBeenCalledWith('floor_stage_excluded_workers',{p_job_id:'pack'});
});
it('fails closed when server eligibility cannot be confirmed',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:{message:'Scope denied'}} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(floorStageVerificationService.excludedWorkers('pack')).rejects.toMatchObject({message:'Scope denied'});
 vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(floorStageVerificationService.excludedWorkers('pack')).rejects.toThrow('could not be confirmed');
});
