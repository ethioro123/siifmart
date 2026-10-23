// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReceiveScan } from '../../components/fulfillment/receive/hooks/useReceiveScan';
import type { Product, PurchaseOrder } from '../../types';
const product={id:'p',sku:'ET001',name:'Item',siteId:'wh'} as Product;
const po={id:'po',siteId:'wh',status:'Partially Received',lineItems:[{id:'line',productId:'p',sku:'ET001',productName:'Item',quantity:10}]} as PurchaseOrder;
const setup=(extra:Partial<Parameters<typeof useReceiveScan>[0]>={})=>{
 const setVariants=vi.fn(),notify=vi.fn(),open=vi.fn();
 const deps={user:{id:'manager',role:'warehouse_manager'},siteId:'wh',blind:true,employees:[],jobs:[],orders:[po],products:[product],allProducts:[product],unresolvedScans:[],setUnresolvedScans:vi.fn(),setSplitReceivingItem:vi.fn(),setSplitReceivingPO:vi.fn(),setSplitVariants:setVariants,setIsSplitReceiving:open,addNotification:notify,setReceiveSearch:vi.fn(),isSplitReceiving:false,splitReceivingItem:null,splitVariants:[],splitReceivingPO:null,...extra};
 return {...renderHook(()=>useReceiveScan(deps)),setVariants,notify,open};
};
describe('blind receiving scan scope',()=>{
 it('opens partial receipts with an empty physical count',async()=>{
  const {result,setVariants,open}=setup();await result.current.handleGlobalScan('ET001');
  expect(open).toHaveBeenCalledWith(true);expect(setVariants).toHaveBeenCalledWith([expect.objectContaining({quantity:0})]);
 });
 it('does not expose or cap blind intake at the expected remaining quantity',async()=>{
  const variants=[{sku:'ET001',quantity:10,barcodes:[]}];
  const {result,setVariants,notify}=setup({isSplitReceiving:true,splitReceivingItem:po.lineItems[0],splitReceivingPO:po,splitVariants:variants});
  await result.current.handleGlobalScan('ET001');
  const update=setVariants.mock.calls[0][0] as (v:typeof variants)=>typeof variants;
  expect(update(variants)[0].quantity).toBe(11);
  expect(notify).not.toHaveBeenCalledWith('alert',expect.stringContaining('remaining PO'));
 });
 it('does not resolve a barcode through another facility product',async()=>{
  const {result,open}=setup({products:[],allProducts:[{...product,siteId:'other'}]});
  await result.current.handleGlobalScan('ET001');expect(open).not.toHaveBeenCalled();
 });
});

it('does not treat two missing product IDs as proof of a matching scan',async()=>{
 const {result,setVariants}=setup({products:[],allProducts:[],isSplitReceiving:true,splitReceivingPO:po,splitReceivingItem:{sku:'ET001',productName:'Item',quantity:10},splitVariants:[{sku:'ET001',quantity:1,barcodes:[]}]});
 await result.current.handleGlobalScan('UNKNOWN');expect(setVariants).not.toHaveBeenCalled();
});
