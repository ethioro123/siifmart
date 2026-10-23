// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePutawayScanning } from '../../components/fulfillment/putaway/hooks/usePutawayScanning';
import type { WMSJob } from '../../types';
const item={productId:'product',sku:'ET001',name:'Diaper',expectedQty:10,pickedQty:0,status:'Pending' as const};
const job={id:'put',siteId:'wh',type:'PUTAWAY',priority:'Normal',status:'In-Progress',items:1,orderRef:'po',location:'Receiving Dock',lineItems:[item]} as WMSJob;
function setup(overrides: Partial<Parameters<typeof usePutawayScanning>[0]>={}){
 const stock=vi.fn();
 const deps={selectedJob:job,currentItem:item,currentProduct:undefined,scannedLocation:'A-01-01',setScannedLocation:vi.fn(),setLocationOccupants:vi.fn(),isSubmitting:false,isSubmittingRef:{current:false},setIsSubmitting:vi.fn(),putawayStock:stock,updateJobItem:vi.fn(),completeJob:vi.fn(),addNotification:vi.fn(),activeSite:{id:'wh'},allProducts:[],user:null,setSelectedJob:vi.fn(),setIsScannerOpen:vi.fn(),...overrides};
 return{...renderHook(()=>usePutawayScanning(deps)),stock};
}
describe('putaway placement preflight',()=>{
 it.each([0,-1,11,NaN,Infinity])('rejects invalid count %s before stock writes',async count=>{
  const{result,stock}=setup();await expect(result.current.handleScanItem('ET001',count)).rejects.toThrow('physical quantity');expect(stock).not.toHaveBeenCalled();
 });
 it('rejects stale completed items before stock writes',async()=>{
  const{result,stock}=setup({selectedJob:{...job,lineItems:[{...item,status:'Completed'}]}});await expect(result.current.handleScanItem('ET001',3)).rejects.toThrow('no longer pending');expect(stock).not.toHaveBeenCalled();
 });
 it('rejects a different facility before stock writes',async()=>{
  const{result,stock}=setup({activeSite:{id:'other'}});await expect(result.current.handleScanItem('ET001',3)).rejects.toThrow('facility');expect(stock).not.toHaveBeenCalled();
 });
});

it('preserves a committed placement when completion fails and never asks to place it again',async()=>{
 const setSelectedJob=vi.fn(),setIsScannerOpen=vi.fn(),notify=vi.fn();
 const completeJob=vi.fn().mockRejectedValue(new Error('Completion unavailable'));
 const {result,stock}=setup({setSelectedJob,setIsScannerOpen,addNotification:notify,completeJob});
 await expect(result.current.handleScanItem('ET001',10)).resolves.toBeUndefined();
 expect(stock).toHaveBeenCalledTimes(1);
 expect(setSelectedJob).toHaveBeenCalledWith(expect.objectContaining({lineItems:[expect.objectContaining({status:'Picked',pickedQty:10,location:'A-01-01'})]}));
 expect(setIsScannerOpen).toHaveBeenCalledWith(false);
 expect(notify).toHaveBeenCalledWith('alert',expect.stringContaining('Stock placement was saved'));
 expect(notify).not.toHaveBeenCalledWith('success','All items put away — Job completed!');
});
it('rejects duplicate submission instead of returning a false success',async()=>{
 const {result,stock}=setup({isSubmittingRef:{current:true}});
 await expect(result.current.handleScanItem('ET001',10)).rejects.toThrow('already being saved');
 expect(stock).not.toHaveBeenCalled();
});
it('preserves decimal physical quantities through placement',async()=>{
 const {result,stock}=setup();await result.current.handleScanItem('ET001',1.25);
 expect(stock).toHaveBeenCalledWith(expect.objectContaining({quantity:1.25}));
});
it('does not accept a different SKU just because punctuation was removed',async()=>{
 const {result,stock}=setup();await expect(result.current.handleScanItem('ET-001',10)).rejects.toThrow('Wrong item');
 expect(stock).not.toHaveBeenCalled();
});
