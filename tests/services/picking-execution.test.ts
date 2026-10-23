import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { pickingExecutionService } from '../../services/picking-execution.service';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
const id='11111111-1111-4111-8111-111111111111';
const input={jobId:id,itemIndex:0,quantity:0,locationBarcode:'123401010100000',itemBarcode:'',shortageReason:'Empty source bin'};
const reply=(data:unknown,error:unknown=null)=>vi.mocked(supabase.rpc).mockResolvedValue({data,error} as Awaited<ReturnType<typeof supabase.rpc>>);
beforeEach(()=>vi.clearAllMocks());
describe('verified picking persistence',()=>{
 it('sends scanned proof, physical quantity and shortage reason without actor or site authority',async()=>{
  reply({id,type:'PICK',status:'In-Progress',line_items:[]});
  expect((await pickingExecutionService.recordLine(input)).id).toBe(id);
  expect(supabase.rpc).toHaveBeenCalledWith('record_pick_line',{p_job_id:id,p_item_index:0,p_quantity:0,p_location_barcode:input.locationBarcode,p_item_barcode:'',p_shortage_reason:'Empty source bin'});
  expect(supabase.from).not.toHaveBeenCalled();
 });
 it('rejects malformed counts and proof before calling the server',async()=>{
  await expect(pickingExecutionService.recordLine({...input,quantity:NaN})).rejects.toThrow();
  await expect(pickingExecutionService.recordLine({...input,locationBarcode:'A-01-01'})).rejects.toThrow();
  expect(supabase.rpc).not.toHaveBeenCalled();
 });
 it('completes only through the atomic RPC and supports the confirmed no-pack outcome',async()=>{
  reply({job:{id,type:'PICK',status:'Completed',line_items:[]},pack:null});
  expect((await pickingExecutionService.complete(id)).pack).toBeNull();
  expect(supabase.rpc).toHaveBeenCalledWith('complete_pick_job',{p_job_id:id});
  expect(supabase.from).not.toHaveBeenCalled();
 });
 it('propagates stock/scope failures and rejects unconfirmed completion',async()=>{
  const error={message:'Insufficient stock'};reply(null,error);
  await expect(pickingExecutionService.complete(id)).rejects.toEqual(error);
  reply({job:{id,status:'In-Progress'}});
  await expect(pickingExecutionService.complete(id)).rejects.toThrow('did not confirm');
 });
});
