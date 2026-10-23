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
