import { describe, expect, it } from 'vitest';
import { Product } from '../../types';
import { canPublishOnlineProduct } from '../../services/online-store.service';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1', siteId: 'site-1', name: 'Tea', category: 'Grocery', price: 20,
  stock: 4, sku: 'TEA-01', image: '', status: 'active', approvalStatus: 'approved', ...overrides,
});

describe('canPublishOnlineProduct', () => {
  it('allows active, approved products that have stock', () => {
    expect(canPublishOnlineProduct(product())).toBe(true);
  });

  it('keeps pending and rejected products out of the public catalog', () => {
    expect(canPublishOnlineProduct(product({ approvalStatus: 'pending' }))).toBe(false);
    expect(canPublishOnlineProduct(product({ approvalStatus: 'rejected' }))).toBe(false);
  });

  it('keeps inactive and out-of-stock products out of the public catalog', () => {
    expect(canPublishOnlineProduct(product({ status: 'archived' }))).toBe(false);
    expect(canPublishOnlineProduct(product({ stock: 0 }))).toBe(false);
  });
});
