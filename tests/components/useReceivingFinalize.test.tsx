// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PurchaseOrder, WMSJob } from '../../types';
const mocks=vi.hoisted(()=>({updatePO:vi.fn(),updateJob:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({purchaseOrdersService:{update:mocks.updatePO},wmsJobsService:{update:mocks.updateJob},productsService:{},systemLogsService:{}}));
vi.mock('../../components/fulfillment/useReceivingSplit',()=>({useReceivingSplit:()=>({receivePOSplit:vi.fn()})}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { useReceiving } from '../../components/fulfillment/useReceiving';
const po:PurchaseOrder={id:'po',siteId:'warehouse',supplierId:'supplier',supplierName:'Supplier',date:'2026-11-05',status:'Approved',totalAmount:10,itemsCount:1,expectedDelivery:null,poNumber:'AAAA0033',lineItems:[]};
const job:WMSJob={id:'receive',siteId:'warehouse',type:'RECEIVE',status:'In-Progress',priority:'Normal',items:1,location:'Dock',orderRef:'po',lineItems:[]};
beforeEach(()=>{vi.clearAllMocks();mocks.updatePO.mockResolvedValue({...po,status:'Partially Received'});});
function setup(){
 const setJobs=vi.fn(),notify=vi.fn();
 const hook=renderHook(()=>useReceiving({orders:[po],allOrders:[po],jobs:[job],products:[],allProducts:[],activeSite:{id:'warehouse',country:'ET'},setJobs,setOrders:vi.fn(),setAllOrders:vi.fn(),addNotification:notify}));
 return {...hook,setJobs,notify};
}
describe('receiving completion persistence',()=>{
 it('keeps the job open and reports failure when its completion save times out',async()=>{
  mocks.updateJob.mockRejectedValue(new Error('statement timeout'));
  const {result,setJobs,notify}=setup();
  await act(async()=>{await expect(result.current.finalizePO('po')).rejects.toThrow('statement timeout');});
  expect(setJobs).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalledWith('success',expect.anything());
  expect(notify).toHaveBeenCalledWith('alert','Failed to finalize PO');
 });
 it('uses the confirmed server job after successful completion',async()=>{
  const saved:WMSJob={...job,status:'Completed',completedBy:'receiver'};
  mocks.updateJob.mockResolvedValue(saved);
  const {result,setJobs,notify}=setup();
  await act(async()=>{await result.current.finalizePO('po');});
  expect(setJobs.mock.calls[0][0]([job])).toEqual([saved]);
  expect(notify).toHaveBeenCalledWith('success',expect.any(String));
 });
});
