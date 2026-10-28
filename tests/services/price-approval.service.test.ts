import { describe,it,expect,vi,beforeEach } from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());vi.mock('../../lib/supabase',()=>({supabase:{rpc}}));
import { priceApprovalService } from '../../services/price-approval.service';
beforeEach(()=>rpc.mockReset());
describe('bounded server price approval routes',()=>{
 it('fetches only the selected request IDs, with no client actor or role',async()=>{
  const data={'request-1':{canApprove:true,canFinance:false,canReject:true}};rpc.mockResolvedValue({data,error:null});
  expect(await priceApprovalService.routes(['request-1'])).toEqual(data);expect(rpc).toHaveBeenCalledWith('get_price_approval_routes',{p_request_ids:['request-1']});
 });
 it('does not query empty or unbounded lists',async()=>{
  expect(await priceApprovalService.routes([])).toEqual({});await expect(priceApprovalService.routes(Array(101).fill('id'))).rejects.toThrow('100');expect(rpc).not.toHaveBeenCalled();
 });
 it('propagates server errors rather than inventing approval authority',async()=>{
  rpc.mockResolvedValue({data:null,error:new Error('Outside country')});await expect(priceApprovalService.routes(['id'])).rejects.toThrow('Outside country');
 });
});
