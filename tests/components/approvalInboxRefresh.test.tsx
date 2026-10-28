// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useNavigate } from 'react-router-dom';
const mocks=vi.hoisted(() => ({ user:{id:'ops-1',role:'regional_operations_manager',country:'ET',regionCode:'ADD',siteId:'hq-1'}, country:'ET', read:vi.fn(), channel:vi.fn(), remove:vi.fn(), handlers:[] as Array<() => void> }));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:mocks.user})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:mocks.country})}));
vi.mock('../../services/approval-inbox.service',()=>({approvalInboxService:{allReviews:mocks.read}}));
vi.mock('../../lib/supabase',()=>({supabase:{channel:mocks.channel,removeChannel:mocks.remove}}));
import { useApprovalInbox } from '../../hooks/useApprovalInbox';
import { APPROVAL_INBOX_KEY } from '../../utils/unifiedApprovalInbox';
function Probe(){ const q=useApprovalInbox(true); const navigate=useNavigate(); return <><p>{q.data?.total ?? 'checking'}</p><button onClick={()=>navigate('/finance')}>Navigate</button></>; }
let client:QueryClient;
beforeEach(()=>{
  client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}}); mocks.read.mockReset(); mocks.channel.mockReset(); mocks.handlers=[]; mocks.remove.mockReset();
  Object.assign(mocks.user,{id:'ops-1',role:'regional_operations_manager',country:'ET',regionCode:'ADD',siteId:'hq-1'}); mocks.country='ET';
  mocks.read.mockImplementation(async(country:string)=>({total:country==='ET'?2:9,unavailable:0,checkedAt:'now',queues:[{key:'purchase_orders',count:2,status:'ready'}]}));
  mocks.channel.mockImplementation(()=>{const channel={on:(_event:unknown,_filter:unknown,callback:()=>void)=>{mocks.handlers.push(callback);return channel;},subscribe:()=>channel}; return channel;});
});
afterEach(()=>{cleanup();client.clear();});
const show=()=>render(<QueryClientProvider client={client}><MemoryRouter><Probe /></MemoryRouter></QueryClientProvider>);
describe('approval inbox freshness and isolation',()=>{
  it('refreshes on navigation and successful mutations',async()=>{
    show(); await screen.findByText('2'); const initial=mocks.read.mock.calls.length;
    fireEvent.click(screen.getByRole('button',{name:'Navigate'})); await waitFor(()=>expect(mocks.read.mock.calls.length).toBeGreaterThan(initial));
    const before=mocks.read.mock.calls.length;
    await act(async()=>{await client.getMutationCache().build(client,{mutationFn:async()=>true}).execute(undefined);});
    await waitFor(()=>expect(mocks.read.mock.calls.length).toBeGreaterThan(before));
  });
  it('refreshes on live events and removes its subscription on unmount',async()=>{
    const view=show(); await screen.findByText('2'); await waitFor(()=>expect(mocks.handlers.length).toBeGreaterThan(0));
    const before=mocks.read.mock.calls.length; act(()=>mocks.handlers.at(-1)?.());
    await waitFor(()=>expect(mocks.read.mock.calls.length).toBeGreaterThan(before)); view.unmount(); expect(mocks.remove).toHaveBeenCalled();
  });
  it('uses a fresh query key after country or identity changes',async()=>{
    const view=show(); await screen.findByText('2'); mocks.country='KE'; mocks.user.id='ops-2'; mocks.user.regionCode='NBO';
    view.rerender(<QueryClientProvider client={client}><MemoryRouter><Probe /></MemoryRouter></QueryClientProvider>);
    await screen.findByText('9'); expect(mocks.read).toHaveBeenLastCalledWith('KE');
    expect(client.getQueryData([APPROVAL_INBOX_KEY,'ops-2','regional_operations_manager','KE','NBO','hq-1'])).toMatchObject({total:9});
  });
  it('does not query or subscribe for floor employees',async()=>{
    mocks.user.role='picker'; show(); await act(async()=>{}); expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.channel).not.toHaveBeenCalled();
  });
});
