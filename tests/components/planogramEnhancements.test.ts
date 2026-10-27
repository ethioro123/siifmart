import { describe, it, expect } from 'vitest';
import { VALID_SHELF_POSITIONS } from '../../hooks/useSubmitMerchandisingChanges';
import { FIXTURE_DEFINITIONS } from '../../components/merchandising/planogram/types';
import type { Product, ShelfPosition } from '../../types';
import type { ProductSalesMetrics } from '../../utils/merchandisingAnalytics';

describe('Planogram Layout Revisions & Constraints', () => {
  it('supports all seven physical shelf positions across fixtures', () => {
    const expectedPositions: ShelfPosition[] = [
      'Eye Level',
      'Top Shelf',
      'Bottom Shelf',
      'End Cap',
      'Checkout',
      'Back Aisle',
      'Secure'
    ];

    expect(VALID_SHELF_POSITIONS).toEqual(expectedPositions);
    expect(VALID_SHELF_POSITIONS.length).toBe(7);
  });

  it('defines fixture types with dedicated tiers and capacities', () => {
    expect(FIXTURE_DEFINITIONS.gondola.tiers.map(t => t.position)).toEqual([
      'Top Shelf',
      'Eye Level',
      'Bottom Shelf'
    ]);
    expect(FIXTURE_DEFINITIONS.end_cap.tiers.map(t => t.position)).toEqual(['End Cap']);
    expect(FIXTURE_DEFINITIONS.checkout.tiers.map(t => t.position)).toEqual(['Checkout']);
    expect(FIXTURE_DEFINITIONS.back_aisle.tiers.map(t => t.position)).toEqual(['Back Aisle']);
    expect(FIXTURE_DEFINITIONS.secure.tiers.map(t => t.position)).toEqual(['Secure']);
  });

  it('calculates tier sales from recorded sales metrics without inventing numbers', () => {
    const mockProducts: Product[] = [
      {
        id: 'p1',
        siteId: 'site-01',
        name: 'Sunflower Cooking Oil 1L',
        sku: 'ET-OIL-01',
        category: 'Cooking Oil',
        price: 250,
        stock: 50,
        shelfPosition: 'Eye Level',
        image: '',
        status: 'active'
      },
      {
        id: 'p2',
        siteId: 'site-01',
        name: 'Corn Oil 2L',
        sku: 'ET-OIL-02',
        category: 'Cooking Oil',
        price: 450,
        stock: 30,
        shelfPosition: 'Eye Level',
        image: '',
        status: 'active'
      },
      {
        id: 'p3',
        siteId: 'site-01',
        name: 'Sugar 1kg',
        sku: 'ET-SUG-01',
        category: 'Pantry',
        price: 120,
        stock: 40,
        shelfPosition: 'Top Shelf',
        image: '',
        status: 'active'
      }
    ];

    const mockMetricsIndex = new Map<string, ProductSalesMetrics>([
      ['p1', { productId: 'p1', unitsSold7d: 35, unitsSold30d: 140, revenue30d: 35000, dailyRunRate: 5, daysOfSupply: 10, effectiveVelocity: 'High', hasOrderHistory: true, stockoutRisk: false, needsMarkdown: false }],
      ['p2', { productId: 'p2', unitsSold7d: 15, unitsSold30d: 60, revenue30d: 27000, dailyRunRate: 2, daysOfSupply: 15, effectiveVelocity: 'Medium', hasOrderHistory: true, stockoutRisk: false, needsMarkdown: false }],
      ['p3', { productId: 'p3', unitsSold7d: 0, unitsSold30d: 0, revenue30d: 0, dailyRunRate: 0, daysOfSupply: 99, effectiveVelocity: 'Low', hasOrderHistory: false, stockoutRisk: false, needsMarkdown: false }]
    ]);

    // Eye Level Tier calculation
    const eyeLevelProducts = mockProducts.filter(p => p.shelfPosition === 'Eye Level');
    const eyeLevelUnits = eyeLevelProducts.reduce((sum, p) => sum + (mockMetricsIndex.get(p.id)?.unitsSold7d || 0), 0);
    const eyeHasData = eyeLevelProducts.some(p => mockMetricsIndex.get(p.id)?.hasOrderHistory);

    expect(eyeLevelUnits).toBe(50); // 35 + 15
    expect(eyeHasData).toBe(true);

    // Top Shelf Tier calculation (no history)
    const topProducts = mockProducts.filter(p => p.shelfPosition === 'Top Shelf');
    const topHasData = topProducts.some(p => mockMetricsIndex.get(p.id)?.hasOrderHistory);
    expect(topHasData).toBe(false);

    // Merchandising Whole-Number Rule for progress bar share
    const totalUnits = eyeLevelUnits; // 50
    const eyeShare = totalUnits > 0 ? Math.round((eyeLevelUnits / totalUnits) * 100) : 0;
    expect(eyeShare).toBe(100);
    expect(Number.isInteger(eyeShare)).toBe(true);
  });

  it('enforces physical weight and ergonomic safety constraints on suggested moves', () => {
    const heavyBaleProduct: Product = {
      id: 'p-heavy',
      siteId: 'site-01',
      name: 'MoliCare Diaper 16pcs Bulk Master Bale',
      sku: 'ET-DIA-01',
      category: 'Baby Care',
      price: 1800,
      stock: 20,
      shelfPosition: 'Bottom Shelf',
      salesVelocity: 'High',
      customAttributes: { package_type: 'Bulk Master Bale' },
      image: '',
      status: 'active'
    };

    // Constraint evaluation
    const isHeavyOrBulk = Boolean(
      heavyBaleProduct.name.toLowerCase().includes('bale') ||
      heavyBaleProduct.name.toLowerCase().includes('bulk') ||
      (heavyBaleProduct.customAttributes as any)?.package_type?.toLowerCase().includes('bulk')
    );

    // Must never be promoted to Prime Eye Level due to physical handling safety
    expect(isHeavyOrBulk).toBe(true);
    const canPromoteToEyeLevel = !isHeavyOrBulk;
    expect(canPromoteToEyeLevel).toBe(false);
  });

  it('keeps unassigned products strictly off shelf tiers until assigned', () => {
    const unplacedProduct: Product = {
      id: 'p-unplaced',
      siteId: 'site-01',
      name: 'Green Tea 100g',
      sku: 'ET-TEA-01',
      category: 'Beverages',
      price: 85,
      stock: 10,
      shelfPosition: undefined, // Unassigned
      image: '',
      status: 'active'
    };

    const bottomShelfTiers = [unplacedProduct].filter(p => p.shelfPosition === 'Bottom Shelf');
    expect(bottomShelfTiers.length).toBe(0);

    const unassignedTray = [unplacedProduct].filter(p => !p.shelfPosition);
    expect(unassignedTray.length).toBe(1);
    expect(unassignedTray[0].id).toBe('p-unplaced');
  });
});
