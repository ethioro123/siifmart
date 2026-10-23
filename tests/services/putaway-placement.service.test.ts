import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
import {supabase} from '../../lib/supabase';
import {putawayPlacementService} from '../../services/putaway-placement.service';
beforeEach(()=>vi.clearAllMocks());
describe('job-authorized atomic putaway',()=>{
 it('sends only job identity, physical quantity, and scanned bin',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:{product_id:'product'},error:null} as never);
  await putawayPlacementService.place('job',0,10,'A-01-01');
  expect(supabase.rpc).toHaveBeenCalledWith('place_putaway_stock',{p_job_id:'job',p_item_index:0,p_quantity:10,p_location:'A-01-01'});
 });
 it('rejects invalid counts before contacting the server',async()=>{
  for(const qty of [0,-1,NaN,Infinity])await expect(putawayPlacementService.place('job',0,qty,'A-01-01')).rejects.toThrow('physical count');
  expect(supabase.rpc).not.toHaveBeenCalled();
 });
 it('propagates server rejection without reporting success',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:{message:'Placement already recorded'}} as never);
  await expect(putawayPlacementService.place('job',0,10,'A-01-01')).rejects.toThrow('already recorded');
 });
 it('requires a confirmed product result',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:null} as never);
  await expect(putawayPlacementService.place('job',0,10,'A-01-01')).rejects.toThrow('did not confirm');
 });
});
