import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {wmsJobsService} from '../../services/wms-jobs.service';
import {getFulfillmentTransferPage} from '../../services/fulfillment-transfer-queue.service';
vi.mock('../../lib/supabase',()=>({supabase:{from:vi.fn()}}));
function query(rows:Record<string,unknown>[]){const q={select:vi.fn(),eq:vi.fn(),not:vi.fn(),order:vi.fn(),limit:vi.fn(),or:vi.fn(),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};for(const fn of [q.select,q.eq,q.not,q.order,q.limit,q.or])fn.mockReturnValue(q);return q;}
beforeEach(()=>vi.clearAllMocks());
describe('bounded active queues',()=>{
 it('uses stable keyset cursors so completing earlier jobs does not skip the next page',async()=>{
  const rows=Array.from({length:25},(_,i)=>({id:`job-${i}`,country_code:'ET',created_at:'2026-10-30T00:00:00Z',line_items:[]}));
  const active=query(rows);const blind=query([]);vi.mocked(supabase.from).mockImplementation(table=>(table==='wms_jobs'?active:blind) as never);
  const first=await wmsJobsService.getActivePage('site','worker','ET');expect(first.hasMore).toBe(true);expect(active.limit).toHaveBeenCalledWith(25);
  await wmsJobsService.getActivePage('site','worker','ET',first.cursor);
  expect(active.or).toHaveBeenLastCalledWith(expect.stringContaining('id.gt.job-24'));expect(active.or).toHaveBeenLastCalledWith(expect.stringContaining('site_id.eq.site'));expect(active.eq).toHaveBeenCalledWith('country_code','ET');
 });
 it('always prefers the blind projection on overlapping records',async()=>{
  const active=query([{id:'job',country_code:'ET',created_at:'now',line_items:[{sku:'sku',expectedQty:100}]}]);const blind=query([{id:'job',country_code:'ET',created_at:'now',line_items:[{sku:'sku'}]}]);vi.mocked(supabase.from).mockImplementation(table=>(table==='wms_jobs'?active:blind) as never);
  const result=await wmsJobsService.getActivePage('site',undefined,'ET');expect(result.jobs).toHaveLength(1);expect(result.jobs[0].lineItems[0].expectedQty).toBeUndefined();expect(blind.select).not.toHaveBeenCalledWith('*');
 });
 it('includes delivered transfers awaiting receipt and keeps masked data authoritative',async()=>{
  const active=query([{id:'transfer',country_code:'ET',created_at:'now',status:'Delivered',items:[{quantity:100}]}]);const blind=query([{id:'transfer',country_code:'ET',created_at:'now',status:'Delivered',items:[{productId:'sku'}]}]);vi.mocked(supabase.from).mockImplementation(table=>(table==='transfers'?active:blind) as never);
  const result=await getFulfillmentTransferPage('site','ET');expect(result.transfers).toHaveLength(1);expect(result.transfers[0].items[0]).not.toHaveProperty('quantity');expect(active.not).toHaveBeenCalledWith('status','in','("Received","Completed","Cancelled","Rejected")');expect(active.limit).toHaveBeenCalledWith(25);
 });
});
