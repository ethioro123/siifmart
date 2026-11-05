// @vitest-environment jsdom
import { act,cleanup,renderHook } from '@testing-library/react';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { WMSJob } from '../../types';
const mock=vi.hoisted(()=>({atomic:vi.fn(),update:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({wmsJobsService:{update:mock.update},jobAssignmentsService:{assignAtomic:mock.atomic}}));
vi.mock('../../services/floor-stage-verification.service',()=>({isIndependentFloorStage:()=>true,floorStageVerificationService:{excludedWorkers:async()=>[]}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn(),debug:vi.fn()}}));
import { useJobActions } from '../../components/fulfillment/useJobActions';
afterEach(cleanup);beforeEach(()=>vi.clearAllMocks());
it('does not announce or display assignment when its atomic authorization write fails',async()=>{
 const job:WMSJob={id:'job',siteId:'warehouse',type:'PUTAWAY',priority:'Normal',status:'Pending',items:1,location:'Dock',orderRef:'po',lineItems:[]};
 mock.atomic.mockRejectedValue(new Error('Assignment refused'));
 const notify=vi.fn(),setJobs=vi.fn(),setHistory=vi.fn();const client=new QueryClient();
 const {result}=renderHook(()=>useJobActions({jobs:[job],jobAssignments:[],employees:[{id:'worker',name:'Worker',role:'stock_clerk'}],user:{id:'manager'},setJobs,setJobAssignments:setHistory,addNotification:notify,queryClient:client,activeSiteId:'warehouse'}));
 await act(async()=>{await expect(result.current.assignJob('job','worker')).rejects.toThrow('Assignment refused');});
 expect(setJobs).not.toHaveBeenCalled();expect(setHistory).not.toHaveBeenCalled();expect(mock.update).not.toHaveBeenCalled();
 expect(notify).not.toHaveBeenCalledWith('success',expect.any(String));client.clear();
});
