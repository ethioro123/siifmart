import {describe,it,expect,vi,beforeEach} from 'vitest';
const rpc=vi.hoisted(()=>vi.fn());vi.mock('../../lib/supabase',()=>({supabase:{rpc}}));
import {priceRetentionService} from '../../services/price-retention.service';
import {productPriceHistoryService} from '../../services/product-price-history.service';
beforeEach(()=>rpc.mockReset());
describe('price retention reads and holds',()=>{
 it('reads bounded product/site/country history with date and literal search inputs',async()=>{
  rpc.mockResolvedValue({data:[],error:null});await productPriceHistoryService.listByProduct('site','et','product',10,100,{since:'2025-10-28T00:00:00Z',search:' Director, "quoted" '});
  expect(rpc).toHaveBeenCalledWith('list_product_price_history',{p_site_id:'site',p_country_code:'ET',p_product_id:'product',p_offset:10,p_limit:50,p_since:'2025-10-28T00:00:00Z',p_search:'Director, "quoted"'});
 });
 it('sends no approver identity for protected hold changes',async()=>{
  rpc.mockResolvedValue({data:{active:true},error:null});await priceRetentionService.manage('product','ke',' Audit opened ',false);
  expect(rpc).toHaveBeenCalledWith('manage_product_price_hold',{p_product_id:'product',p_country_code:'KE',p_reason:'Audit opened',p_release:false});
 });
 it('requires a meaningful release reason before requesting a change',async()=>{
  await expect(priceRetentionService.manage('p','ET',' ',true)).rejects.toThrow('reason');expect(rpc).not.toHaveBeenCalled();
 });
 it('propagates read failures rather than reporting an empty archive or no hold',async()=>{
  rpc.mockResolvedValue({data:null,error:new Error('Country access denied')});await expect(priceRetentionService.status('p','ET')).rejects.toThrow('Country access denied');
  await expect(productPriceHistoryService.listByProduct('s','ET','p')).rejects.toThrow('Country access denied');
 });
});
