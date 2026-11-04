// @vitest-environment jsdom
import React from 'react';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { ReceivingReviewEvidence } from '../../components/fulfillment/review/ReceivingReviewEvidence';
import { receivingReviewEvidence,type ReceivingReviewEvidence as Evidence } from '../../types/operations-review';
const t=(key:string)=>key;
const evidence:Evidence={po_number:'AAAA0033',supplier_name:'Supplier',partial:true,
 items:[{id:'item',sku:'ETDI001',product_name:'Dishes',ordered:960,received:240,outstanding:720}],
 submissions:[{id:'receipt',item_id:'item',created_at:'2026-11-03T06:20:16Z',employee_name:'Counter',has_snapshot:false,original_quantity:null}],
 putaway:[{id:'putaway',reference:'AAAA0033',status:'In-Progress',quantity:240,employee_name:'Putaway worker'}]};
afterEach(cleanup);
describe('receiving manager evidence',()=>{
 it('shows recorded partial quantities with the correct unit comparison and historical submission',()=>{
  render(<ReceivingReviewEvidence value={evidence} t={t} onOpen={vi.fn()}/>);
  for(const value of ['960','240','720'])expect(screen.getByText(value)).toBeTruthy();
  expect(screen.getByText(/Counter/)).toBeTruthy();
  expect(screen.getByText('warehouse.opLegacyReceiptNote')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'warehouse.opOpenSubmittedCount'})).toBeNull();
  expect(screen.getByText('warehouse.opPartialReceiptNote')).toBeTruthy();
 });
 it('shows the inherited job number and opens the exact linked putaway record',()=>{
  const open=vi.fn();render(<ReceivingReviewEvidence value={evidence} t={t} onOpen={open}/>);
  expect(screen.getByText(/warehouse.opJobNumber: AAAA0033/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'warehouse.opOpenReceiptPutaway'}));
  expect(open).toHaveBeenCalledWith({source:'job',id:'putaway'});
 });
 it('opens a locked original count only when a snapshot exists',()=>{
  const open=vi.fn();render(<ReceivingReviewEvidence value={{...evidence,submissions:[{...evidence.submissions[0],has_snapshot:true,original_quantity:240}]}} t={t} onOpen={open}/>);
  fireEvent.click(screen.getByRole('button',{name:'warehouse.opOpenSubmittedCount'}));
  expect(open).toHaveBeenCalledWith({source:'receipt',id:'receipt'});
 });
 it('does not reveal comparisons withheld by the server',()=>{
  render(<ReceivingReviewEvidence value={{...evidence,items:[{...evidence.items[0],ordered:null,outstanding:null}]}} t={t} onOpen={vi.fn()}/>);
  expect(screen.queryByText('960')).toBeNull();expect(screen.queryByText('720')).toBeNull();
  expect(screen.getByText('warehouse.opReceiptComparisonHidden')).toBeTruthy();
 });
 it('accepts the real bounded server evidence shape',()=>{
  expect(receivingReviewEvidence.safeParse({...evidence,items:evidence.items.map(item=>({...item,id:'a3028abe-2647-41b8-b4a0-9336c61965b2'})),submissions:[],putaway:[]}).success).toBe(true);
 });
});
