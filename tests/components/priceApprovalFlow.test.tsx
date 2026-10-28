// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render,screen,fireEvent,cleanup,waitFor } from '@testing-library/react';
import type { PendingInventoryChange } from '../../types';
const state=vi.hoisted(()=>({role:'regional_merchandising_manager'}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'actor',name:'Reviewer',role:state.role}})}));
import { ProposalReviewModal } from '../../components/merchandising/components/ProposalReviewModal';
import { ProductEditApprovalProgress } from '../../components/inventory/ProductEditApprovalProgress';
const row=():PendingInventoryChange=>({id:'request-1',productId:'p-1',productName:'Coffee',productSku:'ET-C',siteId:'store',countryCode:'ET',changeType:'edit',status:'pending',requestedBy:'Specialist',requestedByEmployeeId:'maker',requestedAt:'2026-10-28T10:00:00Z',proposedChanges:{price:100,costPrice:50},priceApprovalRoute:{workflow:'price',canApprove:true,canFinance:false,canReject:true,requiresCountry:false,requiresFinance:false,financeCleared:false,valid:true}});
beforeEach(()=>{state.role='regional_merchandising_manager';});afterEach(cleanup);
describe('single-approver price flow',()=>{
 it('shows one commercial price approval without three-department votes',async()=>{
  const request=row();const approve=vi.fn().mockResolvedValue(undefined);
  render(<ProposalReviewModal request={request} country="ET" currencySymbol="ETB" submitting={false} onClose={()=>{}} onApprove={approve}/>);
  expect(screen.getByRole('heading',{name:'Review price change'})).toBeTruthy();expect(screen.queryByText(/Regional approvals:/)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Approve price change'}));await waitFor(()=>expect(approve).toHaveBeenCalledOnce());
 });
 it('shows the server country-finance requirement and disables final approval',()=>{
  const request=row();request.priceApprovalRoute={canApprove:false,canFinance:false,canReject:true,requiresCountry:true,requiresFinance:true,financeCleared:false,block:'Country Finance Director clearance is required before country commercial approval.'};
  const approve=vi.fn();render(<ProposalReviewModal request={request} country="ET" currencySymbol="ETB" submitting={false} onClose={()=>{}} onApprove={approve}/>);
  expect((screen.getByRole('button',{name:'Approve price change'}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getAllByText(/Country Finance Director clearance/).length).toBeGreaterThan(0);expect(approve).not.toHaveBeenCalled();
 });
 it('allows country commercial final approval after server clearance',()=>{
  state.role='country_commercial_director';const request=row();request.priceApprovalRoute={...request.priceApprovalRoute!,requiresCountry:true,requiresFinance:true,financeCleared:true};
  render(<ProductEditApprovalProgress request={request}/>);expect(screen.getByText('Country Finance clearance: Recorded')).toBeTruthy();expect(screen.getByText(/Country commercial approval/)).toBeTruthy();
 });
 it('fails closed when an old cached price proposal has no server authority result',()=>{
  const request=row();delete request.priceApprovalRoute;
  render(<ProposalReviewModal request={request} country="ET" currencySymbol="ETB" submitting={false} onClose={()=>{}} onApprove={vi.fn()}/>);
  expect((screen.getByRole('button',{name:'Approve price change'}) as HTMLButtonElement).disabled).toBe(true);
 });
});
