import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {transfersService} from '../../services/transfers.service';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
describe('transfer receipt RPC confirmation',()=>{
 it('propagates a missing-transfer error without issuing a fallback PATCH',async()=>{
  const error={code:'P0001',message:'Transfer not found'};
  vi.mocked(supabase.rpc).mockResolvedValue({data:null,error} as Awaited<ReturnType<typeof supabase.rpc>>);
  await expect(transfersService.receiveAtomic('wms-only',{receiverName:'Receiver'})).rejects.toEqual(error);
  expect(supabase.from).not.toHaveBeenCalled();
 });
 it('does not fabricate success for an unconfirmed response',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:{success:false},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
  await expect(transfersService.receiveAtomic('transfer',{receiverName:'Receiver'})).rejects.toThrow('did not confirm');
  expect(supabase.from).not.toHaveBeenCalled();
 });
});
