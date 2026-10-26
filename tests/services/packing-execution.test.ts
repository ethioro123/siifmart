import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {packingExecutionService} from '../../services/packing-execution.service';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
const id='11111111-1111-4111-8111-111111111111';
const reply=(data:unknown,error:unknown=null)=>vi.mocked(supabase.rpc).mockResolvedValue({data,error} as Awaited<ReturnType<typeof supabase.rpc>>);
beforeEach(()=>vi.clearAllMocks());
describe('atomic pack handoff',()=>{
 it('sends only the job ID and requires both persisted job and dispatch',async()=>{reply({job:{id,type:'PACK',status:'Completed',line_items:[]},dispatch:{id:'dispatch',type:'DISPATCH',status:'Pending',line_items:[]}});const saved=await packingExecutionService.complete(id);expect(saved.dispatch.id).toBe('dispatch');expect(supabase.rpc).toHaveBeenCalledWith('complete_pack_job',{p_job_id:id});});
 it('does not report success for a completed job without a dispatch confirmation',async()=>{reply({job:{id,status:'Completed'}});await expect(packingExecutionService.complete(id)).rejects.toThrow('did not confirm');});
 it('propagates permission, hold and quantity errors',async()=>{const error={message:'Resolve discrepancies first'};reply(null,error);await expect(packingExecutionService.complete(id)).rejects.toEqual(error);});
 it('finds only one completed Pack inside the requested site and country',async()=>{
  const query={select:vi.fn(),eq:vi.fn(),limit:vi.fn().mockResolvedValue({data:[{id}],error:null})};
  query.select.mockReturnValue(query);query.eq.mockReturnValue(query);vi.mocked(supabase.from).mockReturnValue(query as never);
  expect(await packingExecutionService.findCompleted('BTZ6X4',id,'ET')).toBe(id);
  expect(query.eq).toHaveBeenCalledWith('site_id',id);expect(query.eq).toHaveBeenCalledWith('country_code','ET');
  expect(query.eq).toHaveBeenCalledWith('status','Completed');expect(query.eq).toHaveBeenCalledWith('job_number','BTZ6X4');expect(query.limit).toHaveBeenCalledWith(2);
 });

});
