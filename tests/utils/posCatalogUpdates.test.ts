import { describe, expect, it } from 'vitest';
import { getPOSCatalogUpdates } from '../../utils/posCatalogUpdates';
import type { Product } from '../../types';
const now = Date.parse('2026-10-29T12:00:00Z');
const sample = (patch: Record<string, unknown> = {}) => ({ id: 'p1', name: 'Coffee', sku: 'ET-COF', siteId: 'store-1', country_code: 'ET', created_at: '2026-10-29T10:00:00Z', ...patch }) as unknown as Product;
describe('site-scoped POS catalog activity', () => {
 it('counts each product once, retaining independently recorded creation and price flags', () => {
  const p = sample({ price_updated_at: '2026-10-29T11:00:00Z' });
  const result = getPOSCatalogUpdates([p,p], 'store-1', 'ET', now);
  expect(result).toHaveLength(1); expect(result[0].kinds).toEqual(['new','price']);
 });
 it('does not infer price or stock changes from a generic update timestamp', () => {
  const p = sample({ created_at: undefined, updated_at: '2026-10-29T11:00:00Z' });
  expect(getPOSCatalogUpdates([p], 'store-1', 'ET', now)[0].kinds).toEqual(['updated']);
 });
 it('fails closed without scope and excludes other sites, countries and unapproved products', () => {
  expect(getPOSCatalogUpdates([sample()], undefined, 'ET', now)).toEqual([]);
  expect(getPOSCatalogUpdates([sample()], 'store-1', undefined, now)).toEqual([]);
  for (const patch of [{siteId:'other'}, {country_code:'KE'}, {approval_status:'pending'}, {approvalStatus:'rejected'}, {approval_status:'archived'}]) {
   expect(getPOSCatalogUpdates([sample(patch)], 'store-1', 'ET', now)).toEqual([]);
  }
 });
 it('excludes invalid, future, missing and expired timestamps', () => {
  for (const created_at of [undefined,'invalid','2026-10-30T00:00:00Z','2026-10-22T12:00:00Z']) {
   expect(getPOSCatalogUpdates([sample({created_at})], 'store-1', 'ET', now)).toEqual([]);
  }
 });
 it('orders newest activity first with a stable identity tie-break', () => {
  expect(getPOSCatalogUpdates([sample({id:'b'}),sample({id:'a'}),sample({id:'c',created_at:'2026-10-29T11:00:00Z'})], 'store-1', 'ET', now).map(row=>row.product.id)).toEqual(['c','a','b']);
 });
 it('expires new notices at seven days and other notices at three days',()=>{
  const rows=[sample({id:'new6',created_at:'2026-10-23T12:00:00Z'}),sample({id:'other2',created_at:undefined,updated_at:'2026-10-27T12:00:00Z'}),sample({id:'other3',created_at:undefined,updated_at:'2026-10-26T12:00:00Z'})];
  expect(getPOSCatalogUpdates(rows,'store-1','ET',now).map(row=>row.product.id)).toEqual(['other2','new6']);
 });
 it('records a later generic revision even when the product is still recently added',()=>{
  const row=getPOSCatalogUpdates([sample({updated_at:'2026-10-29T11:00:00Z'})],'store-1','ET',now)[0];
  expect(row.kinds).toEqual(['new','updated']);expect(row.observations.updated).toBe(Date.parse('2026-10-29T11:00:00Z'));
 });

});
