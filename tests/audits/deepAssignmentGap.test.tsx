// @vitest-environment jsdom
import { act,cleanup,renderHook } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { WMSJob } from '../../types';
const mock=vi.hoisted(()=>({update:vi.fn(),history:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({wmsJobsService:{update:mock.update},jobAssignmentsService:{create:mock.history}}));
vi.mock('../../services/floor-stage-verification.service',()=>({isIndependentFloorStage:()=>true,floorStageVerificationService:{excludedWorkers:async()=>[]}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn(),debug:vi.fn()}}));
import { useJobActions } from '../../components/fulfillment/useJobActions';
afterEach(cleanup);
it('reports successful assignment after the required assignment-history write fails',async()=>{
 const job:WMSJob={id:'job',siteId:'warehouse',type:'PUTAWAY',priority:'Normal',status:'Pending',items:1,location:'Dock',orderRef:'po',lineItems:[]};
 mock.update.mockResolvedValue({...job,assignedTo:'worker',status:'In-Progress'});
 mock.history.mockRejectedValue(new Error('History write refused'));
 const notify=vi.fn(),setJobs=vi.fn(),setHistory=vi.fn();const client=new QueryClient();
 const {result}=renderHook(()=>useJobActions({jobs:[job],jobAssignments:[],employees:[{id:'worker',name:'Worker',role:'stock_clerk'}],user:{id:'manager'},setJobs,setJobAssignments:setHistory,addNotification:notify,queryClient:client,activeSiteId:'warehouse'}));
 await act(async()=>{await result.current.assignJob('job','worker');});
 expect(setJobs).toHaveBeenCalled();expect(setHistory).not.toHaveBeenCalled();
 expect(notify).toHaveBeenCalledWith('success',expect.any(String));
 client.clear();
});
