// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PendingInventoryChange } from '../../types';
const mocks=vi.hoisted(()=>({ role:'group_ceo', read:vi.fn(), approve:vi.fn(), notify:vi.fn(), sites:[] as Array<{id:string;code:string;name:string;country:string}> }));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'actor',role:mocks.role,name:'Regional actor',country:'ET'}})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',activeSite:{id:'hq'},sites:mocks.sites,addNotification:mocks.notify})}));
vi.mock('../../components/merchandising/MerchandisingContext',()=>({useMerchandising:()=>({products:[]})}));
vi.mock('../../services/inventory-requests.service',()=>({inventoryRequestsService:{getMerchandisingRequests:mocks.read,approveProductEdit:mocks.approve}}));
vi.mock('../../hooks/useInventoryRequestMutations',()=>({useCreateInventoryRequestMutation:()=>({isPending:false})}));
import { MerchandisingReviewsTab } from '../../components/merchandising/MerchandisingReviewsTab';
const request=():PendingInventoryChange=>({id:'request-1',productId:'product-1',productName:'Coffee',productSku:'ET-COF',siteId:'store-1',countryCode:'ET',changeType:'edit',status:'pending',requestedBy:'Merchandising team',requestedByEmployeeId:'maker',requestedAt:'2026-10-28T10:00:00Z',proposedChanges:{name:'Coffee beans'},productEditApprovals:[]});
let client:QueryClient;
beforeEach(()=>{client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});mocks.role='group_ceo';mocks.sites=[{id:'store-1',code:'ADD-DC-01',name:'Addis Ababa Distribution Center',country:'ET'}];mocks.read.mockReset();mocks.approve.mockReset();mocks.read.mockResolvedValue({data:[request()],totalCount:1,totalPages:1,hasMore:false});mocks.approve.mockResolvedValue({applied:false,approvalCount:1});});
afterEach(()=>{cleanup();client.clear();});
function show(){return render(<QueryClientProvider client={client}><MemoryRouter><MerchandisingReviewsTab/></MemoryRouter></QueryClientProvider>);}
describe('Merchandising Proposals review opening',()=>{
 it('displays the proposal site name and display ID rather than its database ID',async()=>{
  show();expect(await screen.findByText('Addis Ababa Distribution Center · ADD-DC-01')).toBeTruthy();
  expect(screen.queryByText('store-1')).toBeNull();
 });
 it('does not substitute an active or foreign-country site when the proposal site is unavailable',async()=>{
  mocks.sites=[{id:'store-1',code:'KE-001',name:'Kenya Store',country:'KE'}];show();
  expect(await screen.findByText('Site unavailable')).toBeTruthy();expect(screen.queryByText(/Kenya Store/)).toBeNull();
 });
 it('opens a review for the CEO without granting a regional vote',async()=>{
  show();fireEvent.click(await screen.findByRole('button',{name:'Review proposal for Coffee'}));
  expect(await screen.findByRole('heading',{name:'Review proposal'})).toBeTruthy();
  expect((screen.getByRole('button',{name:'Record regional approval'}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Only the assigned regional/)).toBeTruthy();expect(mocks.approve).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button',{name:'Close'}).at(-1)!);expect(screen.queryByRole('heading',{name:'Review proposal'})).toBeNull();
 });
 it('reviews a single proposal before submitting any regional approval',async()=>{
  mocks.role='regional_operations_manager';show();
  const approvals=await screen.findAllByRole('button',{name:'Record regional approval'});fireEvent.click(approvals[0]);
  expect(await screen.findByRole('heading',{name:'Review proposal'})).toBeTruthy();expect(mocks.approve).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button',{name:'Record regional approval'}).at(-1)!);
  await waitFor(()=>expect(mocks.approve).toHaveBeenCalledWith('request-1'));
 });
 it('opens a complete shelf revision even when the reviewer cannot approve',async()=>{
  const row={...request(),layoutRevisionId:'revision-1',proposedChanges:{shelfPosition:'A-2'},proposalBaseline:{shelf_position:'A-1'}};
  mocks.read.mockResolvedValue({data:[row],totalCount:1,totalPages:1,hasMore:false});show();
  fireEvent.click(await screen.findByRole('button',{name:'Review proposal for Coffee'}));
  expect(await screen.findByRole('heading',{name:'Review the complete shelf revision'})).toBeTruthy();
  await screen.findByText(/A-1 → A-2/);
  expect((screen.getByRole('button',{name:'Approve complete revision'}) as HTMLButtonElement).disabled).toBe(true);
  expect(mocks.approve).not.toHaveBeenCalled();
 });
 it.each(['requester','already-voted','completed'])('still opens a read-only review for %s',async mode=>{
  mocks.role='regional_operations_manager';const row=request();
  if(mode==='requester')row.requestedByEmployeeId='actor';
  if(mode==='already-voted')row.productEditApprovals=[{employeeId:'other',role:'regional_operations_manager',name:'Other manager',approvedAt:'2026-10-28T10:00:00Z'}];
  if(mode==='completed')row.status='approved';
  mocks.read.mockResolvedValue({data:[row],totalCount:1,totalPages:1,hasMore:false});show();
  fireEvent.click(await screen.findByRole('button',{name:'Review proposal for Coffee'}));
  expect(await screen.findByRole('heading',{name:'Review proposal'})).toBeTruthy();
  expect((screen.getAllByRole('button',{name:'Record regional approval'}).at(-1) as HTMLButtonElement).disabled).toBe(true);
  expect(mocks.approve).not.toHaveBeenCalled();
 });
 it('keeps failed approvals open with the actual server error',async()=>{
  mocks.role='regional_operations_manager';mocks.approve.mockRejectedValue(new Error('Product changed since proposal'));show();
  fireEvent.click(await screen.findByRole('button',{name:'Review proposal for Coffee'}));
  fireEvent.click(screen.getAllByRole('button',{name:'Record regional approval'}).at(-1)!);
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Product changed since proposal');
  expect(screen.getByRole('heading',{name:'Review proposal'})).toBeTruthy();
 });
});
