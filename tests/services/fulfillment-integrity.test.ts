import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {receivingTransactionService} from '../../services/receiving-transaction.service';
import {fulfillmentReturnsService,ReturnSale} from '../../services/fulfillment-returns.service';
import {fulfillmentMaintenanceService} from '../../services/fulfillment-maintenance.service';
import type {WMSJob} from '../../types';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
const draft={siteId:'site',type:'PUTAWAY',status:'Pending',priority:'Normal',items:1,lineItems:[]} as Omit<WMSJob,'id'>;
const sale={id:'sale',siteId:'site',countryCode:'ET',currency:'ETB',items:[],total:100} as ReturnSale;
describe('confirmed fulfillment persistence',()=>{
 it('returns only server-confirmed receipt jobs',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:{saved:true,jobIds:['server-job']},error:null} as never);const jobs=await receivingTransactionService.save('retry','po','line',0,[draft]);expect(jobs[0].id).toBe('server-job');expect(supabase.rpc).toHaveBeenCalledWith('save_receiving_split',{p_request:'retry',p_po:'po',p_item:'line',p_previous:0,p_jobs:[draft]});});
 it('rejects a partial receipt response instead of synthesizing jobs',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:{saved:true,jobIds:[]},error:null} as never);await expect(receivingTransactionService.save('retry','po','line',0,[draft])).rejects.toThrow('not confirmed');});
 it('propagates transaction failures',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:{message:'stale receipt'}} as never);await expect(receivingTransactionService.save('retry','po','line',0,[draft])).rejects.toMatchObject({message:'stale receipt'});});
 it('never looks up a blank or unscoped receipt',async()=>{await expect(fulfillmentReturnsService.lookup(' ','site','ET')).rejects.toThrow();await expect(fulfillmentReturnsService.lookup('receipt','','ET')).rejects.toThrow();expect(supabase.rpc).not.toHaveBeenCalled();});
 it('submits scoped return lines without a client refund amount',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:{id:'request',status:'pending',refundAmount:10},error:null} as never);await fulfillmentReturnsService.submit('request',sale,[{saleItemId:'line',quantity:1,reason:'damaged',condition:'Damaged',action:'Repair'}]);expect(supabase.rpc).toHaveBeenCalledWith('submit_fulfillment_return',expect.objectContaining({p_request:'request',p_site:'site',p_country:'ET'}));expect(supabase.from).not.toHaveBeenCalled();});
 it('requires a confirmed return decision',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:null} as never);await expect(fulfillmentReturnsService.decide('request',true,'reviewed')).rejects.toThrow('not confirmed');});
 it('maintenance does not report unconfirmed repairs',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:{message:'supervisor required'}} as never);await expect(fulfillmentMaintenanceService.run('site','ET','reconcile')).rejects.toMatchObject({message:'supervisor required'});});
});
