import { beforeEach,describe,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:mock}));
import { transferIntakeService } from '../../services/transfer-intake.service';
const id='11111111-1111-4111-8111-111111111111';
const confirmation={saved:true,jobId:id,siteId:'22222222-2222-4222-8222-222222222222',countryCode:'ET',receivedAt:'2026-11-06T00:00:00Z',hasDiscrepancy:false};
beforeEach(()=>vi.clearAllMocks());
describe('atomic verified shipment intake',()=>{
 it('submits only the shipment identity and accepts a matching server confirmation',async()=>{
  mock.rpc.mockResolvedValue({data:confirmation,error:null});
  expect(await transferIntakeService.accept(id)).toEqual(confirmation);
  expect(mock.rpc).toHaveBeenCalledWith('accept_verified_transfer',{p_job:id});
  expect(mock.from).not.toHaveBeenCalled();
 });
 it('rejects failed transactions without any compensating product writes',async()=>{
  const error={message:'Arrival required'};mock.rpc.mockResolvedValue({data:null,error});
  await expect(transferIntakeService.accept(id)).rejects.toEqual(error);
  expect(mock.from).not.toHaveBeenCalled();
 });
 it('rejects an unconfirmed or mismatched response',async()=>{
  mock.rpc.mockResolvedValue({data:{...confirmation,saved:false},error:null});
  await expect(transferIntakeService.accept(id)).rejects.toThrow();
  mock.rpc.mockResolvedValue({data:{...confirmation,jobId:confirmation.siteId},error:null});
  await expect(transferIntakeService.accept(id)).rejects.toThrow('does not match');
 });
});
