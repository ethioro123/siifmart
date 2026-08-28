import { describe, it, expect } from 'vitest';
import {
  selectBatchesFEFO,
  getExpiryAlerts,
  type Batch,
} from '../../utils/inventory';
import type { Product } from '../../types';

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
    ...overrides,
  } as Product;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ============================================================================
// FEFO (First Expired, First Out)
// ============================================================================

describe('selectBatchesFEFO', () => {
  const batches: Batch[] = [
    { batchNumber: 'B003', expiryDate: daysFromNow(30), quantity: 20, productId: 'prod_1' },
    { batchNumber: 'B001', expiryDate: daysFromNow(5), quantity: 10, productId: 'prod_1' },
    { batchNumber: 'B002', expiryDate: daysFromNow(15), quantity: 15, productId: 'prod_1' },
  ];

  it('selects earliest-expiring batch first', () => {
    const result = selectBatchesFEFO('prod_1', 5, batches);
    expect(result).toHaveLength(1);
    expect(result[0].batchNumber).toBe('B001'); // expires in 5 days
    expect(result[0].quantity).toBe(5);
  });

  it('spans multiple batches when needed', () => {
    const result = selectBatchesFEFO('prod_1', 20, batches);
    expect(result).toHaveLength(2);
    expect(result[0].batchNumber).toBe('B001'); // 10 units
    expect(result[0].quantity).toBe(10);
    expect(result[1].batchNumber).toBe('B002'); // 10 more from next batch
    expect(result[1].quantity).toBe(10);
  });

  it('takes all available when requesting more than exists', () => {
    const result = selectBatchesFEFO('prod_1', 100, batches);
    expect(result).toHaveLength(3);
    const totalSelected = result.reduce((sum, b) => sum + b.quantity, 0);
    expect(totalSelected).toBe(45); // 10 + 15 + 20
  });

  it('returns empty array for zero quantity', () => {
    const result = selectBatchesFEFO('prod_1', 0, batches);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for unknown product', () => {
    const result = selectBatchesFEFO('unknown_product', 10, batches);
    expect(result).toHaveLength(0);
  });

  it('filters by productId correctly', () => {
    const mixedBatches: Batch[] = [
      ...batches,
      { batchNumber: 'B_OTHER', expiryDate: daysFromNow(1), quantity: 100, productId: 'prod_2' },
    ];
    const result = selectBatchesFEFO('prod_1', 5, mixedBatches);
    expect(result.every(b => b.batchNumber !== 'B_OTHER')).toBe(true);
  });
});

// ============================================================================
// EXPIRY ALERTS
// ============================================================================

describe('getExpiryAlerts', () => {
  it('categorizes products by expiry urgency', () => {
    const products = [
      makeProduct({ id: 'urgent', expiryDate: daysFromNow(0) }),    // today
      makeProduct({ id: 'warning', expiryDate: daysFromNow(5) }),   // 5 days
      makeProduct({ id: 'info', expiryDate: daysFromNow(20) }),     // 20 days
      makeProduct({ id: 'safe', expiryDate: daysFromNow(60) }),     // 60 days — not alerted
    ];

    const result = getExpiryAlerts(products);

    expect(result.urgent.map(p => p.id)).toContain('urgent');
    expect(result.warning.map(p => p.id)).toContain('warning');
    expect(result.info.map(p => p.id)).toContain('info');

    // 'safe' should not appear in any category
    const allAlerted = [...result.urgent, ...result.warning, ...result.info];
    expect(allAlerted.find(p => p.id === 'safe')).toBeUndefined();
  });

  it('skips products without expiry date', () => {
    const products = [
      makeProduct({ expiryDate: undefined }),
      makeProduct({ expiryDate: undefined }),
    ];
    const result = getExpiryAlerts(products);
    expect(result.urgent).toHaveLength(0);
    expect(result.warning).toHaveLength(0);
    expect(result.info).toHaveLength(0);
  });

  it('handles empty product list', () => {
    const result = getExpiryAlerts([]);
    expect(result.urgent).toHaveLength(0);
    expect(result.warning).toHaveLength(0);
    expect(result.info).toHaveLength(0);
  });

  it('marks tomorrow as urgent', () => {
    const products = [makeProduct({ expiryDate: daysFromNow(1) })];
    const result = getExpiryAlerts(products);
    expect(result.urgent).toHaveLength(1);
  });
});

// ============================================================================
// PACKAGE SIZE NORMALIZATION
// ============================================================================
import { getEffectivePackageSize } from '../../utils/units';

describe('getEffectivePackageSize', () => {
  it('converts 1000g specified under KG unit to 1 KG', () => {
    expect(getEffectivePackageSize('KG', '1000')).toBe(1);
    expect(getEffectivePackageSize('KG', 1000)).toBe(1);
  });

  it('converts 1000ml specified under L unit to 1 L', () => {
    expect(getEffectivePackageSize('L', '1000')).toBe(1);
  });

  it('preserves normal package sizes in KG or L', () => {
    expect(getEffectivePackageSize('KG', '1')).toBe(1);
    expect(getEffectivePackageSize('KG', '25')).toBe(25);
    expect(getEffectivePackageSize('L', '0.5')).toBe(0.5);
  });

  it('preserves count-based units', () => {
    expect(getEffectivePackageSize('UNIT', '5')).toBe(5);
    expect(getEffectivePackageSize('PACK', '12')).toBe(12);
  });
});

// ============================================================================
// INVENTORY VALUE & ABC CLASSIFICATION
// ============================================================================
import { getInventoryValue, getABCClass } from '../../components/inventory/utils/inventoryHelpers';

describe('getInventoryValue & getABCClass', () => {
  it('calculates inventory asset value correctly for standard unit', () => {
    const prod = makeProduct({ price: 150, stock: 10, unit: 'piece' });
    expect(getInventoryValue(prod)).toBe(1500);
  });

  it('returns 0 when stock is 0 or price is 0', () => {
    const prod1 = makeProduct({ price: 150, stock: 0 });
    const prod2 = makeProduct({ price: 0, stock: 20 });
    expect(getInventoryValue(prod1)).toBe(0);
    expect(getInventoryValue(prod2)).toBe(0);
  });

  it('correctly classifies high value products into Class A, B, or C', () => {
    const prodA = makeProduct({ price: 1000, stock: 10 }); // value 10,000 (10% of 100,000 -> A)
    const prodB = makeProduct({ price: 300, stock: 10 });  // value 3,000 (3% of 100,000 -> B)
    const prodC = makeProduct({ price: 50, stock: 10 });   // value 500 (0.5% of 100,000 -> C)
    const totalInventoryValue = 100000;

    expect(getABCClass(prodA, totalInventoryValue)).toBe('A');
    expect(getABCClass(prodB, totalInventoryValue)).toBe('B');
    expect(getABCClass(prodC, totalInventoryValue)).toBe('C');
  });
});


