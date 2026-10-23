import { beforeEach, describe, expect, it, vi } from 'vitest';
import { wmsJobsService } from '../../services/wms-jobs.service';
import { supabase } from '../../lib/supabase';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
describe('atomic transfer approval and PICK creation',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('uses the canonical transfer ID and maps a persisted PICK, including retries',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:{id:'pick',type:'PICK',site_id:'source',order_ref:'transfer',line_items:[],status:'Pending'},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
  const result=await wmsJobsService.approveTransferForPicking('transfer');
  expect(result.id).toBe('pick');
  expect(result.orderRef).toBe('transfer');
  expect(supabase.rpc).toHaveBeenCalledWith('approve_transfer_for_picking',{p_transfer_id:'transfer'});
  expect(supabase.from).not.toHaveBeenCalled();
 });
 it('propagates approval rejection without attempting a separate job insert',async()=>{
  const error={code:'42501',message:'Scope denied'};
  vi.mocked(supabase.rpc).mockResolvedValue({data:null,error} as Awaited<ReturnType<typeof supabase.rpc>>);
  await expect(wmsJobsService.approveTransferForPicking('transfer')).rejects.toEqual(error);
  expect(supabase.from).not.toHaveBeenCalled();
 });
 it('requires a confirmed PICK response',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:{id:'transfer',type:'TRANSFER'},error:null} as Awaited<ReturnType<typeof supabase.rpc>>);
  await expect(wmsJobsService.approveTransferForPicking('transfer')).rejects.toThrow('did not confirm');
 });
});
