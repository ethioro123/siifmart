// Failure characterizations for the deeper audit; passing means the current gap was reproduced.
import { beforeEach,describe,expect,it,vi } from 'vitest';
import type { PurchaseOrder } from '../../types';
const mocks=vi.hoisted(()=>({from:vi.fn(),read:vi.fn(),logs:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{from:mocks.from}}));
vi.mock('../../services/purchase-orders.read',()=>({getById:mocks.read,getAll:vi.fn(),getMetrics:vi.fn()}));
vi.mock('../../utils/poDeliveryRequirements',()=>({validatePODelivery:()=>null}));
vi.mock('../../services/system-logs.service',()=>({systemLogsService:{create:mocks.logs}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { accountsPayableService } from '../../services/accounts-payable.service';
const po:PurchaseOrder={id:'11111111-1111-4111-8111-111111111111',siteId:'warehouse',supplierId:'supplier',supplierName:'Supplier',date:'2026-11-06',status:'Draft',totalAmount:100,itemsCount:1,expectedDelivery:null,lineItems:[]};
const line={productName:'Cooking oil',sku:'ET-OIL',quantity:10,unitCost:10,totalCost:100};
beforeEach(()=>{vi.clearAllMocks();mocks.logs.mockResolvedValue({});mocks.read.mockResolvedValue(po);});
describe('procurement and supplier-payment handoff gaps',()=>{
 it('leaves a persisted PO header when its line insertion fails',async()=>{
  let headerExists=false;
  mocks.from.mockImplementation((table:string)=>{
   if(table==='sites')return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{type:'Warehouse',name:'Warehouse',country:'ET'}})})})};
   if(table==='purchase_orders')return {insert:()=>{headerExists=true;return {select:()=>({single:async()=>({data:{po_number:'AAAA9999'},error:null})})};}};
   if(table==='po_items')return {insert:async()=>({error:{code:'23514',message:'Line rejected'}})};
   throw new Error('Unexpected table '+table);
  });
  await expect(purchaseOrdersService.create(po,[line])).rejects.toThrow('Line rejected');
  expect(headerExists).toBe(true);
 });
 it('loses the previous draft lines when replacement insertion fails after deletion',async()=>{
  let savedLines=[line];
  mocks.from.mockImplementation((table:string)=>{
   if(table==='po_items')return {delete:()=>({eq:async()=>{savedLines=[];return {error:null};}}),insert:async()=>({error:new Error('New line rejected')})};
   throw new Error('Unexpected table '+table);
  });
  await expect(purchaseOrdersService.update(po.id,{lineItems:[line]})).rejects.toThrow('New line rejected');
  expect(savedLines).toEqual([]);
 });
 it('accepts mixed-country invoice IDs into one labelled payment run',async()=>{
  let run:Record<string,unknown>={};
  const invoices=[{id:'et-invoice',country_code:'ET',currency:'ETB',total_amount:100,amount_paid:0},{id:'ke-invoice',country_code:'KE',currency:'KES',total_amount:100,amount_paid:0}];
  mocks.from.mockImplementation((table:string)=>{
   if(table==='vendor_invoices')return {select:()=>({in:async()=>({data:invoices,error:null})}),update:()=>({in:async()=>({error:null})})};
   if(table==='payment_runs')return {insert:(value:Record<string,unknown>)=>{run=value;return {select:()=>({single:async()=>({data:{id:'run',...value},error:null})})};}};
   throw new Error('Unexpected table '+table);
  });
  const saved=await accountsPayableService.createPaymentRun(['et-invoice','ke-invoice'],'Bank_Transfer',{id:'finance',name:'Finance'},'ET','ETB');
  expect(saved.totalAmount).toBe(200);
  expect(run.country_code).toBe('ET');expect(run.currency).toBe('ETB');
 });
 it('reports a payment run as created even if linking its invoices fails',async()=>{
  mocks.from.mockImplementation((table:string)=>{
   if(table==='vendor_invoices')return {select:()=>({in:async()=>({data:[{total_amount:100,amount_paid:0}],error:null})}),update:()=>({in:async()=>({error:{message:'Link refused'}})})};
   if(table==='payment_runs')return {insert:(value:Record<string,unknown>)=>({select:()=>({single:async()=>({data:{id:'orphan-run',...value},error:null})})})};
   throw new Error('Unexpected table '+table);
  });
  const saved=await accountsPayableService.createPaymentRun(['invoice'],'Bank_Transfer',{id:'finance',name:'Finance'},'ET','ETB');
  expect(saved.id).toBe('orphan-run');
  expect(mocks.logs).toHaveBeenCalledWith(expect.objectContaining({action:'PAYMENT_RUN_CREATED'}));
 });
});
