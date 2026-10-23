// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../components/fulfillment/ItemAttributeBadges',()=>({ItemAttributeBadges:()=>null}));
import { PutawayJobModal } from '../../components/fulfillment/putaway/PutawayJobModal';
import type { WMSJob } from '../../types';
afterEach(cleanup);
const job = { id:'put-1', siteId:'wh', type:'PUTAWAY', priority:'Normal', status:'In-Progress', items:1, orderRef:'po', location:'Receiving Dock', lineItems:[{productId:'product',sku:'ET001',name:'Diaper',expectedQty:10,pickedQty:0,status:'Pending'}] } as WMSJob;
const props = { isOpen:true,onClose:vi.fn(),job,user:null,sites:[],products:[],onStartPutaway:vi.fn(),onCompleteJob:vi.fn(),isSubmitting:false,resolveOrderRef:(ref?:string)=>ref||'',t:(key:string)=>key };
describe('putaway progression',()=>{
 it('offers only one start scanning action and does not expose a premature completion',()=>{
  render(<PutawayJobModal {...props}/>);
  const buttons=screen.getAllByRole('button',{name:'Start scanning'});
  expect(buttons).toHaveLength(1);fireEvent.click(buttons[0]);
  expect(props.onStartPutaway).toHaveBeenCalledWith(job);
  expect(screen.queryByRole('button',{name:'Complete Putaway'})).toBeNull();
 });
 it('shows read-only routing with one bottom scanner action',()=>{
  render(<PutawayJobModal {...props}/>);
  fireEvent.click(screen.getByRole('button',{name:/Bin Routing/}));
  expect(screen.getAllByRole('button',{name:'Start scanning'})).toHaveLength(1);
  expect(screen.queryByLabelText('Scan bin or SKU barcode')).toBeNull();
  expect(screen.getByText('Awaiting physical placement')).toBeTruthy();
 });
 it('shows one disabled completion action for an already completed job',()=>{
  render(<PutawayJobModal {...props} job={{...job,status:'Completed',lineItems:job.lineItems.map(item=>({...item,status:'Completed'}))}}/>);
  expect(screen.getAllByRole('button',{name:'Complete Putaway'})).toHaveLength(1);
  expect((screen.getByRole('button',{name:'Complete Putaway'}) as HTMLButtonElement).disabled).toBe(true);
 });
});

it('allows completion retry after an already-recorded short placement without rescanning stock',()=>{
 render(<PutawayJobModal {...props} job={{...job,lineItems:job.lineItems.map(item=>({...item,status:'Short',pickedQty:4,location:'A-01-01'}))}}/>);
 const complete=screen.getByRole('button',{name:'Complete Putaway'}) as HTMLButtonElement;
 expect(complete.disabled).toBe(false);
 expect(screen.queryByRole('button',{name:'Start scanning'})).toBeNull();
});
