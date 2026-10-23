// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { WMSJob } from '../../types';
import { useCompletePickJob } from '../../hooks/useCompletePickJob';
import { pickingExecutionService } from '../../services/picking-execution.service';
vi.mock('../../services/picking-execution.service',()=>({pickingExecutionService:{complete:vi.fn()}}));
const job={id:'pick',type:'PICK',siteId:'dc',countryCode:'ET',status:'Completed',completedBy:'picker',lineItems:[{expectedQty:2,pickedQty:0,status:'Short'}]} as WMSJob;
const setup=()=>{
 const notify=vi.fn(),setJobs=vi.fn(),invalidate=vi.fn().mockResolvedValue(undefined);
 const {result}=renderHook(()=>useCompletePickJob({setJobs,addNotification:notify,queryClient:{invalidateQueries:invalidate} as unknown as QueryClient}));
 return {complete:result.current,notify,setJobs,invalidate};
};
describe('confirmed picking completion UI',()=>{
 it('does not announce success or change local jobs if the server rejects completion',async()=>{
  vi.mocked(pickingExecutionService.complete).mockRejectedValueOnce(new Error('Insufficient stock'));
  const {complete,notify,setJobs}=setup();
  await act(async()=>{await expect(complete('pick')).rejects.toThrow('Insufficient stock');});
  expect(notify).not.toHaveBeenCalled();expect(setJobs).not.toHaveBeenCalled();
 });
 it('shows an explicit no-pack outcome for a confirmed all-short job',async()=>{
  vi.mocked(pickingExecutionService.complete).mockResolvedValueOnce({job,pack:null});
  const {complete,notify,invalidate}=setup();await act(async()=>{await complete('pick');});
  expect(notify).toHaveBeenCalledWith('success',expect.stringContaining('No packing job was created'));
  expect(invalidate).toHaveBeenCalledWith({queryKey:['products','dc']});
 });
 it('adds only the returned PACK and preserves a previously loaded copy on retry',async()=>{
  const pack={id:'pack',type:'PACK'} as WMSJob;
  vi.mocked(pickingExecutionService.complete).mockResolvedValueOnce({job,pack});
  const {complete,setJobs,notify}=setup();await act(async()=>{await complete('pick');});
  const update=setJobs.mock.calls[0][0] as (jobs:WMSJob[])=>WMSJob[];
  expect(update([job])).toHaveLength(2);expect(update([job,pack])).toHaveLength(2);
  expect(notify).toHaveBeenCalledWith('success',expect.stringContaining('Stock deducted and packing job created'));
 });
});
