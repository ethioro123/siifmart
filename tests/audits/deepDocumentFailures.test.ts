import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PurchaseOrder } from '../../types';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),read:vi.fn(),logs:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{from:mocks.from,rpc:mocks.rpc}}));
vi.mock('../../services/purchase-orders.read',()=>({getById:mocks.read,getAll:vi.fn(),getMetrics:vi.fn()}));
vi.mock('../../utils/poDeliveryRequirements',()=>({validatePODelivery:()=>null}));
vi.mock('../../services/system-logs.service',()=>({systemLogsService:{create:mocks.logs}}));
vi.mock('../../utils/logger',()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { accountsPayableService } from '../../services/accounts-payable.service';
const po:PurchaseOrder={id:'11111111-1111-4111-8111-111111111111',siteId:'warehouse',supplierId:'supplier',supplierName:'Supplier',date:'2026-11-06',status:'Draft',totalAmount:100,itemsCount:1,expectedDelivery:null,lineItems:[]};
const line={productName:'Cooking oil',sku:'ET-OIL',quantity:10,unitCost:10,totalCost:100};
beforeEach(()=>{
 vi.clearAllMocks();mocks.logs.mockResolvedValue({});mocks.read.mockResolvedValue(po);
 mocks.from.mockImplementation((table:string)=>{
  if(table==='sites') return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{type:'Warehouse',name:'Warehouse',country:'ET'}})})})};
  throw new Error('Unexpected direct document mutation: '+table);
 });
});
describe('atomic procurement and supplier-payment handoffs',()=>{
 it('sends PO header and lines in one transaction and propagates rejection',async()=>{
  mocks.rpc.mockResolvedValue({error:new Error('Line rejected')});
  await expect(purchaseOrdersService.create(po,[line])).rejects.toThrow('Line rejected');
  expect(mocks.rpc).toHaveBeenCalledWith('save_purchase_order_document',expect.objectContaining({p_id:po.id,p_create:true,p_header:expect.objectContaining({site_id:'warehouse'}),p_items:[expect.objectContaining({sku:'ET-OIL'})]}));
  expect(mocks.logs).not.toHaveBeenCalled();
 });
 it('replaces draft lines and header in one transaction without client deletion',async()=>{
  mocks.rpc.mockResolvedValue({error:new Error('New line rejected')});
  await expect(purchaseOrdersService.update(po.id,{lineItems:[line],notes:'Updated'})).rejects.toThrow('New line rejected');
  expect(mocks.rpc).toHaveBeenCalledWith('save_purchase_order_document',expect.objectContaining({p_id:po.id,p_create:false,p_header:{notes:'Updated'},p_items:[expect.objectContaining({quantity:10})]}));
 });
 it('delegates country/currency validation and payment membership to the trusted transaction',async()=>{
  mocks.rpc.mockResolvedValue({error:new Error('Invoice country mismatch')});
  await expect(accountsPayableService.createPaymentRun(['et-invoice','ke-invoice'],'Bank_Transfer',{id:'finance',name:'Finance'},'ET','ETB')).rejects.toThrow('Invoice country mismatch');
  expect(mocks.rpc).toHaveBeenCalledWith('create_payment_run_atomic',{p_ids:['et-invoice','ke-invoice'],p_country:'ET',p_currency:'ETB',p_channel:'Bank_Transfer'});
  expect(mocks.logs).not.toHaveBeenCalled();
 });
 it('does not report a payment run as created if its transaction fails',async()=>{
  mocks.rpc.mockResolvedValue({error:new Error('Link refused')});
  await expect(accountsPayableService.createPaymentRun(['invoice'],'Bank_Transfer',{id:'finance',name:'Finance'},'ET','ETB')).rejects.toThrow('Link refused');
  expect(mocks.logs).not.toHaveBeenCalled();
 });
});
