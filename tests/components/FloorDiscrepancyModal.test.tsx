// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloorDiscrepancyModal } from '../../components/fulfillment/discrepancies/FloorDiscrepancyModal';
import type { WMSJob, User } from '../../types';
const mocks=vi.hoisted(()=>({report:vi.fn(),resolve:vi.fn(),history:[] as unknown[]}));
vi.mock('../../hooks/useFloorDiscrepancies',()=>({useFloorDiscrepancies:()=>({history:{data:mocks.history,isSuccess:true},report:{mutateAsync:mocks.report,isPending:false},resolve:{mutateAsync:mocks.resolve,isPending:false}})}));
const job={id:'job',type:'PACK',assignedTo:'packer',status:'In-Progress',lineItems:[{sku:'SKU',name:'Item',expectedQty:23,pickedQty:23,packedQty:0}]} as WMSJob;
const user={id:'packer',role:'packer'} as User;
const setup=()=>render(<FloorDiscrepancyModal isOpen onClose={vi.fn()} job={job} user={user} addNotification={vi.fn()}/>);
afterEach(cleanup);beforeEach(()=>{vi.clearAllMocks();mocks.history=[];mocks.report.mockResolvedValue({});});
describe('physical count and independent recount',()=>{
 it('requires a second count and reason before reporting a shortage, without modifying picked quantities',async()=>{
  setup();fireEvent.change(screen.getByLabelText('First physical count'),{target:{value:'20'}});
  fireEvent.click(screen.getByRole('button',{name:'Recount independently'}));
  expect(mocks.report).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Second physical count'),{target:{value:'20'}});
  fireEvent.change(screen.getByLabelText('Observed issue'),{target:{value:'Only 20 units at the packing station'}});
  fireEvent.click(screen.getByRole('button',{name:'Report difference and hold job'}));
  await waitFor(()=>expect(mocks.report).toHaveBeenCalledWith({jobId:'job',itemIndex:0,firstCount:20,recount:20,reason:'Only 20 units at the packing station'}));
  expect(job.lineItems?.[0].pickedQty).toBe(23);
  expect(screen.queryByPlaceholderText(/PIN/)).toBeNull();
 });
 it('allows correction before submission when the recount matches the original manifest',()=>{
  setup();fireEvent.change(screen.getByLabelText('First physical count'),{target:{value:'25'}});
  fireEvent.click(screen.getByRole('button',{name:'Recount independently'}));
  fireEvent.change(screen.getByLabelText('Second physical count'),{target:{value:'23'}});
  expect(screen.getByRole('status').textContent).toContain('Recount matches');
  expect(screen.queryByRole('button',{name:'Report difference and hold job'})).toBeNull();
  expect(mocks.report).not.toHaveBeenCalled();
 });
 it('shows a persisted hold and prevents the reporter from approving their own report',()=>{
  mocks.history=[{id:'report',item_index:0,expected_qty:23,first_count:20,recount:20,reporter_id:'packer',reporter_name:'Packer',reported_at:'2026-10-27T00:00:00Z',reason:'20 units',resolved_at:null}];
  setup();expect(screen.getByText(/On hold/)).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Reconcile line 1'})).toBeNull();
 });
});
