import {expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:mock}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn()}}));
import {accountsReceivableService} from '../../services/accounts-receivable.service';
it('documents that receivables aging silently totals only the first 25 invoices',async()=>{
 const invoices=Array.from({length:26},(_,i)=>({id:'invoice-'+i,invoice_number:'I'+i,customer_id:'customer',customer_name:'Customer',site_id:'store',country_code:'ET',invoice_date:'2026-11-06',due_date:'2099-01-01',subtotal:100,total_amount:100,amount_paid:0,currency:'ETB',status:'Open'}));
 const range=vi.fn(async(start:number,end:number)=>({data:invoices.slice(start,end+1),error:null}));
 const query={eq:vi.fn(),order:vi.fn(),range};query.eq.mockReturnValue(query);query.order.mockReturnValue(query);
 mock.from.mockReturnValue({select:()=>query});
 const report=await accountsReceivableService.getAgingReport('ET');
 expect(range).toHaveBeenCalledWith(0,24);
 expect(report.totalOutstanding).toBe(2500); // Full report would include all 26: 2600.
});
