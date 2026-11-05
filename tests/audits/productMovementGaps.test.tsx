// @vitest-environment jsdom
import { act,cleanup,renderHook } from '@testing-library/react';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({accept:vi.fn(),get:vi.fn(),verify:vi.fn(),product:vi.fn(),job:vi.fn()}));
vi.mock('../../services/transfer-intake.service',()=>({transferIntakeService:{accept:mock.accept}}));
vi.mock('../../services/transfer-receipt-verification.service',()=>({transferReceiptVerificationService:{get:mock.get}}));
vi.mock('../../components/pos-command/hooks/utils/verifyPOSTransferReceipt',()=>({verifyPOSTransferReceipt:mock.verify}));
vi.mock('../../services/supabase.service',()=>({productsService:{update:mock.product},wmsJobsService:{update:mock.job}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { usePOSReceiving } from '../../components/pos-command/hooks/usePOSReceiving';
const id='11111111-1111-4111-8111-111111111111';
const line={productId:'product',sku:'ET-OIL',name:'Oil',receivedQty:5,condition:'Good'};
const confirmed={saved:true,jobId:id,siteId:'store',countryCode:'ET',receivedAt:'2026-11-06T00:00:00Z',hasDiscrepancy:false};
afterEach(cleanup);
beforeEach(()=>{vi.clearAllMocks();mock.get.mockResolvedValue({status:'verified',items:[line]});mock.verify.mockResolvedValue([line]);mock.accept.mockResolvedValue(confirmed);});
function setup(refresh=vi.fn().mockResolvedValue(undefined),phase='Delivered'){
 const notify=vi.fn();const refreshJobs=vi.fn();
 const job={id,type:'TRANSFER',status:'Pending',transferStatus:phase,destSiteId:'store',orderRef:'order',lineItems:[line]};
 const hook=renderHook(()=>usePOSReceiving({user:{name:'Receiver',role:'receiver'},activeSite:{id:'store'},allProducts:[],transfers:[],jobs:[job],addProduct:vi.fn(),adjustStock:vi.fn(),refreshData:refresh,refreshJobs,addNotification:notify,formatJobId:()=>id,t:k=>k}));
 return {...hook,notify,refreshJobs};
}
describe('atomic receipt and refresh failure recovery',()=>{
 it('keeps saved stock and a concurrent sale intact when refresh fails after receiving',async()=>{
  let stock=10;
  mock.accept.mockImplementation(async()=>{stock+=5;stock-=1;return confirmed;});
  const {result,notify}=setup(vi.fn().mockRejectedValue(new Error('Refresh unavailable')));
  await act(async()=>{await result.current.handleSelectTransferForReceiving(id);});
  await act(async()=>{await result.current.handleConfirmTransferReceiving();});
  expect(stock).toBe(14);
  expect(mock.product).not.toHaveBeenCalled();expect(mock.job).not.toHaveBeenCalled();
  expect(mock.accept).toHaveBeenCalledWith(id);
  expect(notify).toHaveBeenCalledWith('success','posCommand.shipmentReceivedSuccess');
  expect(notify).not.toHaveBeenCalledWith('alert',expect.anything());
 });
 it('does not mutate balances or claim success when server intake fails',async()=>{
  mock.accept.mockRejectedValue(new Error('Saved count required'));
  const {result,notify}=setup();
  await act(async()=>{await result.current.handleSelectTransferForReceiving(id);});
  await act(async()=>{await result.current.handleConfirmTransferReceiving();});
  expect(mock.product).not.toHaveBeenCalled();expect(mock.job).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalledWith('success',expect.anything());
  expect(notify).toHaveBeenCalledWith('alert',expect.stringContaining('Saved count required'));
 });
 it('allows saved partial arrivals to reach the receiving transaction',async()=>{
  const {result}=setup(undefined,'Partially Delivered');
  await act(async()=>{await result.current.handleSelectTransferForReceiving(id);});
  expect(result.current.isReceivingModalOpen).toBe(true);
  await act(async()=>{await result.current.handleConfirmTransferReceiving();});
  expect(mock.accept).toHaveBeenCalledWith(id);
 });
});
