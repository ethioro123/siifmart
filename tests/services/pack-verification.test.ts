import { beforeEach, expect, it, vi } from 'vitest';
import { packVerificationService } from '../../services/pack-verification.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
it('uses server picker attribution rather than only loaded active jobs',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:['picker'],error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 expect(await packVerificationService.excludedWorkers('pack')).toEqual(['picker']);
 expect(supabase.rpc).toHaveBeenCalledWith('pack_excluded_workers',{p_pack_job_id:'pack'});
});
it('fails closed when server eligibility cannot be confirmed',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:{message:'Scope denied'}} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(packVerificationService.excludedWorkers('pack')).rejects.toMatchObject({message:'Scope denied'});
 vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
 await expect(packVerificationService.excludedWorkers('pack')).rejects.toThrow('could not be confirmed');
});
