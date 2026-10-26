import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {floorAuditService} from '../../services/floor-audit.service';
import {workerPointsService} from '../../services/gamification.service';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn()}}));
const id='11111111-1111-4111-8111-111111111111';
const reply=(data:unknown,error:unknown=null)=>vi.mocked(supabase.rpc).mockResolvedValue({data,error} as Awaited<ReturnType<typeof supabase.rpc>>);
beforeEach(()=>vi.clearAllMocks());
describe('scoped discrepancy audit and review',()=>{
 it('requests bounded product history within site and country',async()=>{reply([]);await floorAuditService.load({kind:'product',id,siteId:id,country:'ET'},2);expect(supabase.rpc).toHaveBeenCalledWith('floor_audit_timeline',{p_site_id:id,p_country:'ET',p_kind:'product',p_id:id,p_offset:40});});
 it('propagates denied supervisor review',async()=>{const error={message:'Separate supervisor required'};reply(null,error);await expect(floorAuditService.review({jobId:id,discrepancyId:id,finding:'undetermined',responsibleId:null,notes:'Cause remains unknown'})).rejects.toEqual(error);});
 it('does not present a deferred award as a saved points balance',async()=>{reply({pending_review:true,job_id:id});expect(await workerPointsService.awardCompletedJob(id)).toEqual({pendingReview:true});});
 it('requires confirmation before displaying a submitted review',async()=>{reply({discrepancy_id:id,reviewed_at:null});await expect(floorAuditService.review({jobId:id,discrepancyId:id,finding:'stock_issue',responsibleId:null,notes:'Stock shortage verified'})).rejects.toThrow('not confirmed');});
});
