import { describe, it, expect } from 'vitest';
import {
  calculateDynamicPrice,
  calculateDemandMultiplier,
  calculateCompetitorMultiplier,
  calculateInventoryMultiplier,
  type DynamicPricingFactors,
} from '../../utils/pricing';
import type { Product, SaleRecord } from '../../types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod_1',
    siteId: 'site_1',
    name: 'Test Product',
    category: 'Beverages',
    sku: 'TP-001',
    price: 10,
    stock: 50,
    barcodes: ['123456'],
    costPrice: 5,
    ...overrides,
  } as Product;
}

function makeSale(productId: string, quantity: number, daysAgo: number = 0): SaleRecord {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id: `sale_${Math.random().toString(36).slice(2)}`,
    date: date.toISOString(),
    items: [{ id: productId, quantity, price: 10, name: 'Test', sku: 'TP-001' }],
    total: quantity * 10,
    subtotal: quantity * 10,
    tax: 0,
    paymentMethod: 'Cash',
    siteId: 'site_1',
  } as unknown as SaleRecord;
}

// ============================================================================
// DYNAMIC PRICING
// ============================================================================

describe('calculateDynamicPrice', () => {
  const neutralFactors: DynamicPricingFactors = {
    demandMultiplier: 1.0,
    competitorMultiplier: 1.0,
    inventoryMultiplier: 1.0,
    timeMultiplier: 1.0,
  };

  it('returns base price with neutral factors', () => {
    const product = makeProduct({ costPrice: 10, price: 20 });
    const result = calculateDynamicPrice(product, neutralFactors);
    // With all 1.0 multipliers, price = costPrice * 1.0^4 = 10
    // But minimum margin is 10% so min = 11
    expect(result).toBe(11);
  });

  it('enforces minimum 10% margin', () => {
    const product = makeProduct({ costPrice: 100, price: 200 });
    const lowFactors: DynamicPricingFactors = {
      demandMultiplier: 0.8,
      competitorMultiplier: 0.9,
      inventoryMultiplier: 0.7,
      timeMultiplier: 0.8,
    };
    const result = calculateDynamicPrice(product, lowFactors);
    // minPrice = 100 * 1.1 = 110
    expect(result).toBeGreaterThanOrEqual(110);
  });

  it('enforces maximum 300% markup', () => {
    const product = makeProduct({ costPrice: 10, price: 20 });
    const highFactors: DynamicPricingFactors = {
      demandMultiplier: 1.5,
      competitorMultiplier: 1.1,
      inventoryMultiplier: 1.2,
      timeMultiplier: 1.3,
    };
    const result = calculateDynamicPrice(product, highFactors);
    // maxPrice = 10 * 3 = 30
    expect(result).toBeLessThanOrEqual(30);
  });

  it('rounds to 2 decimal places', () => {
    const product = makeProduct({ costPrice: 7.33, price: 15 });
    const result = calculateDynamicPrice(product, neutralFactors);
    const decimals = result.toString().split('.')[1]?.length || 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('uses price as fallback when costPrice is undefined', () => {
    const product = makeProduct({ costPrice: undefined, price: 20 });
    const result = calculateDynamicPrice(product, neutralFactors);
    // basePrice = 20, neutral = 20, min margin = 22
    expect(result).toBe(22);
  });
});

// ============================================================================
// DEMAND MULTIPLIER
// ============================================================================

describe('calculateDemandMultiplier', () => {
  const product = makeProduct();

  it('returns 1.0 for moderate demand (5-10 units sold)', () => {
    const product = makeProduct();
    // 7 sales of 1 unit each = 7 total units → falls in 5-10 range
    const sales = Array.from({ length: 7 }, (_, i) => makeSale(product.id, 1, i));
    const result = calculateDemandMultiplier(product, sales);
    expect(result).toBe(1.0); // 7 units: not > 10 and not < 5
  });

  it('returns high multiplier for 50+ unit sales', () => {
    // 60 units sold across sales in last 7 days
    const sales = Array.from({ length: 6 }, (_, i) => makeSale(product.id, 10, i));
    const result = calculateDemandMultiplier(product, sales);
    expect(result).toBe(1.3);
  });

  it('returns low multiplier for < 2 units sold', () => {
    // 1 sale of 1 unit = 1 total unit → falls in < 2 range
    const sales = [makeSale(product.id, 1, 0)];
    const result = calculateDemandMultiplier(product, sales);
    expect(result).toBe(0.85); // 1 unit < 2, so 0.85
  });

  it('returns 0.85 for zero sales', () => {
    const result = calculateDemandMultiplier(product, []);
    expect(result).toBe(0.85);
  });

  it('ignores sales older than 7 days', () => {
    const oldSales = Array.from({ length: 100 }, (_, i) => makeSale(product.id, 5, 10 + i));
    const result = calculateDemandMultiplier(product, oldSales);
    expect(result).toBe(0.85); // No recent sales
  });
});

// ============================================================================
// COMPETITOR MULTIPLIER
// ============================================================================

describe('calculateCompetitorMultiplier', () => {
  it('returns 1.0 when no competitor price', () => {
    const product = makeProduct({ competitorPrice: undefined });
    expect(calculateCompetitorMultiplier(product)).toBe(1.0);
  });

  it('returns < 1 when we are much more expensive', () => {
    const product = makeProduct({ price: 120, competitorPrice: 100 });
    const result = calculateCompetitorMultiplier(product);
    expect(result).toBeLessThan(1.0);
  });

  it('returns > 1 when we are much cheaper', () => {
    const product = makeProduct({ price: 80, competitorPrice: 100 });
    const result = calculateCompetitorMultiplier(product);
    expect(result).toBeGreaterThan(1.0);
  });

  it('returns 1.0 when prices are similar', () => {
    const product = makeProduct({ price: 100, competitorPrice: 100 });
    expect(calculateCompetitorMultiplier(product)).toBe(1.0);
  });
});

// ============================================================================
// INVENTORY MULTIPLIER
// ============================================================================

describe('calculateInventoryMultiplier', () => {
  it('returns 0.85 for overstocked items (> 100)', () => {
    const product = makeProduct({ stock: 150 });
    expect(calculateInventoryMultiplier(product)).toBe(0.85);
  });

  it('returns 0.95 for moderately overstocked (50-100)', () => {
    const product = makeProduct({ stock: 75 });
    expect(calculateInventoryMultiplier(product)).toBe(0.95);
  });

  it('returns 1.0 for normal stock (10-50)', () => {
    const product = makeProduct({ stock: 30 });
    expect(calculateInventoryMultiplier(product)).toBe(1.0);
  });

  it('returns 1.1 for low stock (5-10)', () => {
    const product = makeProduct({ stock: 7 });
    expect(calculateInventoryMultiplier(product)).toBe(1.1);
  });

  it('returns 1.2 for critically low stock (< 5)', () => {
    const product = makeProduct({ stock: 3 });
    expect(calculateInventoryMultiplier(product)).toBe(1.2);
  });
});
