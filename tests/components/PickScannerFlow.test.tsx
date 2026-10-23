// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PickScanner } from '../../components/fulfillment/pick/PickScanner';
import { encodeLocation } from '../../utils/locationEncoder';
import type { WMSJob, Product } from '../../types';
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(s:string)=>s})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',settings:{}})}));
vi.mock('../../hooks/useScanOnly',()=>({useScanOnly:()=>({onKeyDown:vi.fn(),onPaste:vi.fn(),reset:vi.fn()})}));
vi.mock('../../utils/audioUtils',()=>({playBeep:vi.fn()}));
const item={productId:'product',sku:'ETBB002',name:'Diapers',location:'A-01-01',expectedQty:2,pickedQty:0,status:'Pending'};
const job={id:'job',type:'PICK',siteId:'dc',lineItems:[item]} as WMSJob;
const product={id:'product',siteId:'dc',sku:'ETBB002',unit:'UNIT',location:'A-01-01'} as Product;
const setup=()=>{
 const save=vi.fn().mockResolvedValue(undefined);const location=vi.fn();
 render(<PickScanner job={job} currentItem={item} currentProduct={product} products={[product]} onClose={vi.fn()} onScanLocation={location} onScanItem={save} isProcessing={false} expectedPrefix="1234"/>);
 return {save,location};
};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
beforeEach(()=>{let now=100000;vi.spyOn(Date,'now').mockImplementation(()=>now+=1000);vi.spyOn(window,'confirm').mockReturnValue(true);});
const scanBay=async()=>{
 const input=screen.getByRole('textbox',{name:'Scan barcode'});
 fireEvent.change(input,{target:{value:encodeLocation('A-01-01','1234')}});
 fireEvent.submit(input.closest('form')!);
 await waitFor(()=>expect(screen.getByRole('button',{name:'No stock in this bay'})).toBeTruthy());
};
describe('verified picking scanner',()=>{
 it('records an audited zero shortage only after scanning the source bay and entering a reason',async()=>{
  const {save,location}=setup();
  expect(screen.queryByRole('button',{name:'No stock in this bay'})).toBeNull();
  await scanBay();expect(location).toHaveBeenCalledWith(encodeLocation('A-01-01','1234'));
  fireEvent.click(screen.getByRole('button',{name:'No stock in this bay'}));
  const qty=screen.getByRole('spinbutton');expect((qty as HTMLInputElement).value).toBe('0');
  fireEvent.submit(qty.closest('form')!);expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('textbox',{name:'Shortage reason'}),{target:{value:'Bin physically empty'}});
  fireEvent.submit(qty.closest('form')!);
  await waitFor(()=>expect(save).toHaveBeenCalledWith('',0,'Bin physically empty'));
 });
 it('does not turn the empty-bin action into an unscanned positive pick',async()=>{
  const {save}=setup();await scanBay();
  fireEvent.click(screen.getByRole('button',{name:'No stock in this bay'}));
  const qty=screen.getByRole('spinbutton');fireEvent.change(qty,{target:{value:'2'}});
  fireEvent.submit(qty.closest('form')!);
  await waitFor(()=>expect(screen.getByText('Scan the product before recording a positive quantity.')).toBeTruthy());
  expect(save).not.toHaveBeenCalled();
 });
});
