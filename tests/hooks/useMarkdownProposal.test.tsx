// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMarkdownProposal } from '../../hooks/useMarkdownProposal';
import type { Product } from '../../types';
const mocks=vi.hoisted(()=>({submit:vi.fn(),refetch:vi.fn()}));
vi.mock('../../hooks/useSubmitPriceChanges',()=>({useSubmitPriceChanges:()=>({submit:mocks.submit})}));
vi.mock('../../hooks/useProductChanges',()=>({useProductChanges:()=>({pending:{refetch:mocks.refetch}})}));
const product={id:'p',siteId:'site',price:100,costPrice:70} as Product;
const deadline='2099-01-01';
// Use a relative date within the supported planning horizon.
const target=()=>{const d=new Date();d.setDate(d.getDate()+7);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
beforeEach(()=>{vi.clearAllMocks();mocks.refetch.mockResolvedValue({data:{data:[]}});mocks.submit.mockResolvedValue({submitted:1,failures:[]});});
it('saves one proposal, blocks concurrent clicks and retains success across regeneration',async()=>{
 let release!: (value:unknown)=>void;mocks.refetch.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
 const {result}=renderHook(()=>useMarkdownProposal(product,'ET','scope'));
 let first!:Promise<void>;
 act(()=>{first=result.current.send(90,target());});
 await act(async()=>{await result.current.send(90,target());release({data:{data:[]}});await first;});
 expect(mocks.submit).toHaveBeenCalledTimes(1);expect(result.current.feedback?.saved).toBe(true);
 await act(async()=>{await result.current.send(80,target());});expect(mocks.submit).toHaveBeenCalledTimes(1);
});
it('fails closed on unavailable checks or existing pending edits',async()=>{
 const {result}=renderHook(()=>useMarkdownProposal(product,'ET','scope'));
 mocks.refetch.mockResolvedValue({error:new Error('Offline')});
 await act(async()=>{await result.current.send(90,target());});expect(result.current.feedback?.message).toContain('could not be checked');
 mocks.refetch.mockResolvedValue({data:{data:[{id:'existing'}]}});
 await act(async()=>{await result.current.send(90,target());});expect(result.current.feedback?.message).toContain('pending edit');expect(mocks.submit).not.toHaveBeenCalled();
});
it('does not submit if scope changes while checking approvals',async()=>{
 let release!: (value:unknown)=>void;mocks.refetch.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
 const {result,rerender}=renderHook(({scope})=>useMarkdownProposal(product,'ET',scope),{initialProps:{scope:'ET-site'}});
 let sending!:Promise<void>;act(()=>{sending=result.current.send(90,target());});
 rerender({scope:'KE-site'});
 await act(async()=>{release({data:{data:[]}});await sending;});expect(mocks.submit).not.toHaveBeenCalled();
});
it('reports failed saves without claiming approval or activation and rejects stale dates',async()=>{
 const {result}=renderHook(()=>useMarkdownProposal(product,'ET','scope'));
 mocks.submit.mockResolvedValue({submitted:0,failures:[{message:'Permission denied'}]});
 await act(async()=>{await result.current.send(90,target());});expect(result.current.feedback).toMatchObject({saved:false,message:'Permission denied'});
 await act(async()=>{await result.current.send(90,deadline);});expect(mocks.submit).toHaveBeenCalledTimes(1);
});
it('cancels pending submission when the planner is unmounted on a scope change',async()=>{
 let release!: (value:unknown)=>void;mocks.refetch.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
 const {result,unmount}=renderHook(()=>useMarkdownProposal(product,'ET','scope'));
 let sending!:Promise<void>;act(()=>{sending=result.current.send(90,target());});unmount();
 await act(async()=>{release({data:{data:[]}});await sending;});expect(mocks.submit).not.toHaveBeenCalled();
});
