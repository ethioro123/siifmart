// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const service = vi.hoisted(() => ({listBySite:vi.fn(),countUnreviewed:vi.fn(),markReviewed:vi.fn()}));
vi.mock('../../../services/product-price-history.service',()=>({productPriceHistoryService:service}));
import { usePOSPriceHistory } from '../../../components/pos/hooks/usePOSPriceHistory';
import type { ProductPriceHistoryEntry } from '../../../services/product-price-history.service';
const row = (id:string) => ({id,reviewed_by_me:false}) as ProductPriceHistoryEntry;
beforeEach(()=>{vi.resetAllMocks();service.listBySite.mockResolvedValue([row('h1')]);service.countUnreviewed.mockResolvedValue(1);service.markReviewed.mockResolvedValue(undefined);});
afterEach(cleanup);
describe('shared POS price review persistence',()=>{
 it('saves per-user receipts and refreshes the pending count',async()=>{
  service.countUnreviewed.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
  const {result}=renderHook(()=>usePOSPriceHistory('store-1','reviewer',''));
  await waitFor(()=>expect(result.current.entries).toHaveLength(1));
  await act(()=>result.current.markReviewed(['h1']));
  expect(service.markReviewed).toHaveBeenCalledWith(['h1'],'reviewer');
  expect(service.countUnreviewed).toHaveBeenCalledWith('store-1');
  expect(service.countUnreviewed.mock.calls.every(call=>call.length===1)).toBe(true);
  expect(result.current.entries[0].reviewed_by_me).toBe(true);expect(result.current.unreviewedCount).toBe(0);
 });
 it('exposes an unavailable count when the receipt saves but recount fails',async()=>{
  service.countUnreviewed.mockResolvedValueOnce(1).mockRejectedValueOnce(new Error('count failed'));
  const {result}=renderHook(()=>usePOSPriceHistory('store-1','reviewer',''));
  await waitFor(()=>expect(result.current.entries).toHaveLength(1));await act(()=>result.current.markReviewed(['h1']));
  expect(result.current.entries[0].reviewed_by_me).toBe(true);expect(result.current.error).toContain('review saved');
 });
 it('does not load price history without a signed-in reviewer',async()=>{
  const {result}=renderHook(()=>usePOSPriceHistory('store-1',undefined,''));
  await act(async()=>{});expect(service.listBySite).not.toHaveBeenCalled();expect(result.current.entries).toEqual([]);
 });
 it('discards late history from the previous site or reviewer',async()=>{
  let resolveOld:(rows:ProductPriceHistoryEntry[])=>void=()=>{};
  service.listBySite.mockImplementationOnce(()=>new Promise<ProductPriceHistoryEntry[]>(resolve=>{resolveOld=resolve;})).mockResolvedValueOnce([row('h2')]);
  const {result,rerender}=renderHook(({site,user})=>usePOSPriceHistory(site,user,''),{initialProps:{site:'store-1',user:'reviewer'}});
  rerender({site:'store-2',user:'another'});await waitFor(()=>expect(result.current.entries[0]?.id).toBe('h2'));
  await act(async()=>resolveOld([row('h1')]));expect(result.current.entries.map(entry=>entry.id)).toEqual(['h2']);
 });
});
