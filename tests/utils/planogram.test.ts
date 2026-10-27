import { describe, expect, it } from 'vitest';
import { planogramStoreProducts, suggestPlanogramMoves } from '../../utils/planogram';
import type { Product } from '../../types';
import type { ProductSalesMetrics } from '../../utils/merchandisingAnalytics';
const product = (id: string, siteId = 'store-a', shelfPosition = 'Bottom Shelf'): Product => ({
  id, siteId, shelfPosition, name: 'Cooking oil', sku: id, category: 'Grocery', price: 100, stock: 10, image: '', status: 'active'
});
const metrics = (units: number, history = true): ProductSalesMetrics => ({ productId: 'a', unitsSold7d: units,
  unitsSold30d: units, revenue30d: 100, dailyRunRate: 1, daysOfSupply: 10, effectiveVelocity: 'High',
  hasOrderHistory: history, stockoutRisk: false, needsMarkdown: false });
describe('planogram store boundaries and sales candidates', () => {
  it('keeps an empty or unknown store empty rather than exposing another catalog', () => {
    expect(planogramStoreProducts([product('a')], 'store-b')).toEqual([]);
    expect(planogramStoreProducts([product('a')], '')).toEqual([]);
  });
  it('excludes archived products and other stores', () => {
    expect(planogramStoreProducts([product('a'), { ...product('b'), status: 'archived' }, product('c', 'store-b')], 'store-a').map(p => p.id)).toEqual(['a']);
  });
  it('accepts the database site alias without widening scope', () => {
    expect(planogramStoreProducts([{ ...product('a'), siteId: '', site_id: 'store-b' }], 'store-b')).toHaveLength(1);
  });
  it('does not invent evidence from a stored high velocity classification', () => {
    expect(suggestPlanogramMoves([{ ...product('a'), salesVelocity: 'High' }], new Map(), new Set())).toEqual([]);
    expect(suggestPlanogramMoves([product('a')], new Map([['a', metrics(0, false)]]), new Set())).toEqual([]);
  });
  it('omits products with pending placement proposals', () => {
    expect(suggestPlanogramMoves([product('a')], new Map([['a', metrics(20)]]), new Set(['a']))).toEqual([]);
  });
  it('creates a review candidate without claiming physical safety was verified', () => {
    const [move] = suggestPlanogramMoves([product('a')], new Map([['a', metrics(20)]]), new Set());
    expect(move.targetPosition).toBe('Eye Level');
    expect(move.selected).toBe(false);
    expect(move.constraints).toEqual({ weightSafe: false, capacityOk: false, categoryCompatible: false });
  });
  it('keeps unassigned products unassigned until an explicit placement is chosen', () => {
    expect(suggestPlanogramMoves([{ ...product('a'), shelfPosition: undefined }], new Map([['a', metrics(20)]]), new Set())).toEqual([]);
  });
});
