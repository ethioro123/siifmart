import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:mock}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn()}}));
import {accountsReceivableService} from '../../services/accounts-receivable.service';
beforeEach(()=>vi.clearAllMocks());
it('uses complete server totals without reading the first invoice page',async()=>{
 mock.rpc.mockResolvedValue({data:{current:2600,days31to60:0,days61to90:0,days90Plus:0,totalOutstanding:2600},error:null});
 expect((await accountsReceivableService.getAgingReport('ET')).totalOutstanding).toBe(2600);
 expect(mock.rpc).toHaveBeenCalledWith('ar_aging_totals',{p_country:'ET'});expect(mock.from).not.toHaveBeenCalled();
});
it('propagates aggregate errors instead of showing zero debt',async()=>{
 mock.rpc.mockResolvedValue({data:null,error:new Error('Report unavailable')});
 await expect(accountsReceivableService.getAgingReport('ET')).rejects.toThrow('Report unavailable');
});
