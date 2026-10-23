// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useJobActions } from '../../components/fulfillment/useJobActions';
import { wmsJobsService } from '../../services/supabase.service';
import type { WMSJob } from '../../types';
import type { QueryClient } from '@tanstack/react-query';
vi.mock('../../services/supabase.service',()=>({wmsJobsService:{update:vi.fn()},jobAssignmentsService:{}}));
const job={id:'pack',type:'PACK',siteId:'dc',lineItems:[{sku:'SKU',expectedQty:2,pickedQty:2,status:'Pending'}]} as WMSJob;
const setup=()=>{
 const setJobs=vi.fn(),notify=vi.fn();
 const {result}=renderHook(()=>useJobActions({jobs:[job],jobAssignments:[],employees:[],user:{id:'worker'},setJobs,setJobAssignments:vi.fn(),addNotification:notify,activeSiteId:'dc',queryClient:{invalidateQueries:vi.fn()} as unknown as QueryClient}));
 return {result,setJobs,notify};
};
beforeEach(()=>vi.clearAllMocks());
describe('packing item persistence',()=>{
 it('propagates save failure without updating local packed state or announcing success',async()=>{
  vi.mocked(wmsJobsService.update).mockRejectedValueOnce(new Error('Save rejected'));
  const {result,setJobs,notify}=setup();
  await act(async()=>{await expect(result.current.updateJobItem('pack',0,'Picked',2)).rejects.toThrow('Save rejected');});
  expect(setJobs).not.toHaveBeenCalled();expect(notify).not.toHaveBeenCalledWith('success',expect.anything());
 });
 it('waits for the server before presenting the saved item',async()=>{
  let confirm:(job:WMSJob)=>void=()=>{};
  vi.mocked(wmsJobsService.update).mockImplementationOnce(()=>new Promise(resolve=>{confirm=resolve;}));
  const {result,setJobs}=setup();
  await act(async()=>{
   const saving=result.current.updateJobItem('pack',0,'Picked',2);
   expect(setJobs).not.toHaveBeenCalled();confirm(job);await saving;
  });
  expect(setJobs).toHaveBeenCalledTimes(1);
 });
});
