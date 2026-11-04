// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PurchaseOrder, WMSJob } from '../../types';
const mocks=vi.hoisted(()=>({finalize:vi.fn()}));
vi.mock('../../services/supabase.service',()=>({purchaseOrdersService:{},wmsJobsService:{},productsService:{},systemLogsService:{}}));
vi.mock('../../services/receiving-finalization.service',()=>({receivingFinalizationService:{finalize:mocks.finalize}}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
vi.mock('../../components/fulfillment/useReceivingSplit',()=>({useReceivingSplit:()=>({receivePOSplit:vi.fn()})}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { useReceiving } from '../../components/fulfillment/useReceiving';
const po:PurchaseOrder={id:'po',siteId:'warehouse',supplierId:'supplier',supplierName:'Supplier',date:'2026-11-05',status:'Approved',totalAmount:10,itemsCount:1,expectedDelivery:null,poNumber:'AAAA0033',lineItems:[]};
const job:WMSJob={id:'receive',siteId:'warehouse',type:'RECEIVE',status:'In-Progress',priority:'Normal',items:1,location:'Dock',orderRef:'po',lineItems:[]};
beforeEach(()=>{vi.clearAllMocks();});
function setup(){
 const setJobs=vi.fn(),setOrders=vi.fn(),notify=vi.fn();
 const hook=renderHook(()=>useReceiving({orders:[po],allOrders:[po],jobs:[job],products:[],allProducts:[],activeSite:{id:'warehouse',country:'ET'},setJobs,setOrders,setAllOrders:vi.fn(),addNotification:notify}));
 return {...hook,setJobs,setOrders,notify};
}
describe('receiving completion persistence',()=>{
 it('keeps the job open and reports failure when its completion save times out',async()=>{
  mocks.finalize.mockRejectedValue(new Error('statement timeout'));
  const {result,setJobs,setOrders,notify}=setup();
  await act(async()=>{await expect(result.current.finalizePO('po')).rejects.toThrow('statement timeout');});
  expect(setJobs).not.toHaveBeenCalled();
  expect(setOrders).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalledWith('success',expect.anything());
  expect(notify).toHaveBeenCalledWith('alert','warehouse.receivingFinalizeFailed');
 });
 it('uses the confirmed server job after successful completion',async()=>{
  const saved:WMSJob={...job,status:'Completed',completedBy:'receiver',completedAt:'2026-11-05'};
  mocks.finalize.mockResolvedValue({id:po.id,status:'Received',jobs:[{id:job.id,status:'Completed',completed_by:'receiver',completed_at:'2026-11-05'}]});
  const {result,setJobs,notify}=setup();
  await act(async()=>{await result.current.finalizePO('po');});
  expect(setJobs.mock.calls[0][0]([job])).toEqual([saved]);
  expect(notify).toHaveBeenCalledWith('success',expect.any(String));
 });
});
