import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { discrepancyService } from '../../services/discrepancy.service';
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
const id='11111111-1111-4111-8111-111111111111';
const row={id,job_id:id,item_index:0,stage:'PACK',expected_qty:23,first_count:20,recount:20,reason:'Three units absent',reporter_id:id,reporter_name:'Packer',reported_at:'2026-10-27T00:00:00Z',resolution:null,resolved_qty:null,resolution_notes:null,resolver_id:null,resolver_name:null,resolved_at:null};
const reply=(data:unknown,error:unknown=null)=>vi.mocked(supabase.rpc).mockResolvedValue({data,error} as Awaited<ReturnType<typeof supabase.rpc>>);
beforeEach(()=>vi.clearAllMocks());
describe('audited Pick and Pack discrepancies',()=>{
 it.each([20,25])('submits an observed count of %i without authority or replacement manifest fields',async count=>{
  reply({...row,first_count:count,recount:count});
  await discrepancyService.reportFloor({jobId:id,itemIndex:0,firstCount:count,recount:count,reason:'Physical count differs'});
  expect(supabase.rpc).toHaveBeenCalledWith('report_floor_discrepancy',{p_job_id:id,p_item_index:0,p_first_count:count,p_recount:count,p_reason:'Physical count differs'});
 });
 it('rejects malformed quantities and preserves a zero shortage',async()=>{
  await expect(discrepancyService.reportFloor({jobId:id,itemIndex:0,firstCount:NaN,recount:20,reason:'Absent units'})).rejects.toThrow();
  expect(supabase.rpc).not.toHaveBeenCalled();
  reply({...row,first_count:0,recount:0});
  expect((await discrepancyService.reportFloor({jobId:id,itemIndex:0,firstCount:0,recount:0,reason:'Empty bay'})).recount).toBe(0);
 });
 it('propagates server approval denial without fabricating a resolution',async()=>{
  const error={message:'A separate authenticated supervisor must reconcile this discrepancy'};reply(null,error);
  await expect(discrepancyService.resolveFloor({jobId:id,discrepancyId:id,resolution:'goods_recovered',quantity:23,notes:'Recovered units verified'})).rejects.toEqual(error);
 });
 it('requires a confirmed server resolution',async()=>{
  reply(row);
  await expect(discrepancyService.resolveFloor({jobId:id,discrepancyId:id,resolution:'goods_recovered',quantity:23,notes:'Recovered units verified'})).rejects.toThrow('did not confirm');
 });
});
