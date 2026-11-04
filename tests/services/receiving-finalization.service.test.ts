import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
import { supabase } from '../../lib/supabase';
import { receivingFinalizationService } from '../../services/receiving-finalization.service';
const id='62b3caff-b285-4e9b-a431-17e1df9165fb';
const saved={id,saved:true,status:'Received',jobs:[{id:'95c91815-cada-44f3-bbf4-895ad8499e11',status:'Completed',completed_by:'worker',completed_at:'2026-11-05'}]};
beforeEach(()=>vi.resetAllMocks());
it('submits only the order ID and requires confirmed completed jobs',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:saved,error:null} as never);
 await expect(receivingFinalizationService.finalize(id)).resolves.toEqual(saved);
 expect(supabase.rpc).toHaveBeenCalledWith('finalize_receiving_session',{p_po:id});
});
it('rejects absent, partial and wrong-order acknowledgements',async()=>{
 for(const data of [null,{...saved,jobs:[]},{...saved,id:'95c91815-cada-44f3-bbf4-895ad8499e11'},{...saved,jobs:[{...saved.jobs[0],status:'In-Progress'}]}]){
  vi.mocked(supabase.rpc).mockResolvedValue({data,error:null} as never);
  await expect(receivingFinalizationService.finalize(id)).rejects.toThrow();
 }
});
it('propagates a transaction failure without reporting a saved receipt',async()=>{
 vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:new Error('job on hold')} as never);
 await expect(receivingFinalizationService.finalize(id)).rejects.toThrow('job on hold');
});
