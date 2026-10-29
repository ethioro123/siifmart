// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogUpdate } from '../../../utils/posCatalogUpdates';
import type { CatalogRead } from '../../../services/pos-catalog-reads.service';
const service = vi.hoisted(()=>({list:vi.fn(),mark:vi.fn()}));
vi.mock('../../../services/pos-catalog-reads.service',()=>({posCatalogReadsService:service}));
import { usePOSCatalogReads, unreadCatalogProducts } from '../../../hooks/usePOSCatalogReads';
const timestamp=Date.parse('2026-10-29T12:00:00Z');
const update=(patch:Partial<CatalogUpdate>={}):CatalogUpdate=>({product:{id:'p1'} as CatalogUpdate['product'],kinds:['new'],timestamp,observations:{new:timestamp},...patch});
beforeEach(()=>{vi.resetAllMocks();service.list.mockResolvedValue([]);service.mark.mockResolvedValue(undefined);});
afterEach(cleanup);
describe('catalog read lifecycle',()=>{
 it('counts products once and never treats a catalog read as price acknowledgement',()=>{
  const rows=[update({kinds:['new','price','updated'],observations:{new:timestamp,price:timestamp,updated:timestamp}})];
  expect(unreadCatalogProducts(rows,[])).toBe(1);
  const reads:CatalogRead[]=[{product_id:'p1',kind:'new',read_through:new Date(timestamp).toISOString()},{product_id:'p1',kind:'updated',read_through:new Date(timestamp).toISOString()}];
  expect(unreadCatalogProducts(rows,reads)).toBe(0);
  expect(unreadCatalogProducts([update({kinds:['price'],observations:{price:timestamp}})],[])).toBe(0);
 });
 it('keeps attention until the exact visible revision saves, and restores it for a newer revision',async()=>{
  let finish:()=>void=()=>{};service.mark.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
  const {result,rerender}=renderHook(({rows})=>usePOSCatalogReads('user','site','ET',rows),{initialProps:{rows:[update()]}});
  await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.unreadCount).toBe(1);
  let save:Promise<void>=Promise.resolve();act(()=>{save=result.current.markPageRead([update()]);});
  expect(result.current.unreadCount).toBe(1);
  await act(async()=>{finish();await save;});expect(result.current.unreadCount).toBe(0);
  expect(service.mark).toHaveBeenCalledWith('site','ET',[{product_id:'p1',kind:'new',read_through:new Date(timestamp).toISOString()}]);
  rerender({rows:[update({observations:{new:timestamp,updated:timestamp+1000},kinds:['new','updated']})]});
  expect(result.current.unreadCount).toBe(1);
 });
 it('retains attention after a failed save',async()=>{
  service.mark.mockRejectedValue(new Error('offline'));
  const {result}=renderHook(()=>usePOSCatalogReads('user','site','ET',[update()]));await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(()=>result.current.markPageRead([update()]));expect(result.current.error).toBe('save');expect(result.current.unreadCount).toBe(1);
 });
 it('restores saved reads after reload and scopes them to the current employee/site/country',async()=>{
  service.list.mockResolvedValueOnce([{product_id:'p1',kind:'new',read_through:new Date(timestamp).toISOString()}]);
  const {result,rerender}=renderHook(({user,site,country})=>usePOSCatalogReads(user,site,country,[update()]),{initialProps:{user:'user',site:'site',country:'ET'}});
  await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.unreadCount).toBe(0);
  rerender({user:'other',site:'other-site',country:'KE'});await waitFor(()=>expect(result.current.isLoading).toBe(false));
  expect(result.current.unreadCount).toBe(1);expect(service.list).toHaveBeenLastCalledWith('other','other-site','KE',['p1']);
 });
 it('discards late receipt fetches after an identity change',async()=>{
  let finish:(rows:CatalogRead[])=>void=()=>{};service.list.mockImplementationOnce(()=>new Promise<CatalogRead[]>(resolve=>{finish=resolve;}));
  const {result,rerender}=renderHook(({user})=>usePOSCatalogReads(user,'site','ET',[update()]),{initialProps:{user:'user'}});
  rerender({user:'other'});await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(async()=>finish([{product_id:'p1',kind:'new',read_through:new Date(timestamp).toISOString()}]));
  expect(result.current.unreadCount).toBe(1);
 });
});
