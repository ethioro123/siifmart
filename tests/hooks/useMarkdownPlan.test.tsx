// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMarkdownPlan } from '../../hooks/useMarkdownPlan';
const mocks=vi.hoisted(()=>({generate:vi.fn()}));
vi.mock('../../services/markdown-planning.service',()=>({markdownPlanningService:{generate:mocks.generate}}));
beforeEach(()=>vi.clearAllMocks());
it('discards a late plan if product, date or scope changes while generating',async()=>{
 let finish!:(value:unknown)=>void;mocks.generate.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 const {result,rerender}=renderHook(({signature})=>useMarkdownPlan(signature),{initialProps:{signature:'old'}});
 let generated!:Promise<unknown>;act(()=>{generated=result.current.generate('p','ET','2026-11-01');});
 rerender({signature:'new'});await act(async()=>{finish({token:'old'});await generated;});expect(result.current.plan).toBeNull();
});
it('locks generation, invalidates displayed evidence and propagates server validation',async()=>{
 mocks.generate.mockResolvedValue({token:'token',stages:[{}]});
 const {result,rerender}=renderHook(({signature})=>useMarkdownPlan(signature),{initialProps:{signature:'first'}});
 await act(async()=>{await result.current.generate('p','ET','2026-11-01');});expect(result.current.plan?.token).toBe('token');
 rerender({signature:'second'});expect(result.current.plan).toBeNull();
 mocks.generate.mockRejectedValue({message:'Deadline exceeds recorded expiry'});
 await act(async()=>{await result.current.generate('p','ET','2026-11-02');});expect(result.current.error).toContain('expiry');expect(result.current.plan).toBeNull();
});
