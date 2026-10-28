// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PendingInventoryChange } from '../../types';
const mocks=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('../../services/scoped-price-proposals.service',()=>({getScopedPriceTargets:mocks.read}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'reviewer',role:'country_commercial_director'}})}));
import { ScopedPriceTargets } from '../../components/merchandising/components/ScopedPriceTargets';
let client:QueryClient;
const request={id:'group-1',priceApprovalRoute:{targetCount:30,scopeLabel:'Country scope · ET'}} as PendingInventoryChange;
function show(){return render(<QueryClientProvider client={client}><ScopedPriceTargets request={request} country="ET" currency="ETB" /></QueryClientProvider>);}
beforeEach(()=>{client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});mocks.read.mockReset();mocks.read.mockResolvedValue([{productId:'p1',siteId:'s1',siteCode:'ADD-01',siteName:'Addis Store',regionCode:'ADD',baseline:{price:100,cost_price:80,is_on_sale:false,sale_price:null},proposal:{price:120,isOnSale:false}}]);});
afterEach(()=>{cleanup();client.clear();});
describe('scoped price review',()=>{
 it('shows site display codes, per-site prices and margins with bounded pagination',async()=>{
  show();expect(await screen.findByText('Addis Store')).toBeTruthy();expect(screen.getByText('ADD-01 · ADD')).toBeTruthy();expect(screen.getByText('33%')).toBeTruthy();
  expect(mocks.read).toHaveBeenCalledWith('group-1',0);
  fireEvent.click(screen.getByRole('button',{name:'Next locations'}));await waitFor(()=>expect(mocks.read).toHaveBeenCalledWith('group-1',25));
 });
 it('reports a failed evidence read without claiming zero included locations',async()=>{
  mocks.read.mockRejectedValue(new Error('Access denied'));show();expect(await screen.findByRole('alert')).toHaveProperty('textContent','Location prices could not be loaded. Retry');expect(screen.queryByRole('table')).toBeNull();
 });
});
