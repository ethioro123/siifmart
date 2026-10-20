import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Product } from '../../types';
import { canPublishOnlineProduct, onlineStoreService } from '../../services/online-store.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1', siteId: 'site-1', name: 'Tea', category: 'Grocery', price: 20,
  stock: 4, sku: 'TEA-01', image: '', status: 'active', approvalStatus: 'approved', ...overrides,
});

describe('online order warehouse handoff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('enters orders through the authenticated operations RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'OPS-123', error: null } as never);
    const number = await onlineStoreService.createOrder('warehouse-1', {
      customerName: 'Ada Buyer', customerPhone: '0712345678', deliveryAddress: 'Market Road 12',
      items: [{ productId: 'product-1', quantity: 2 }],
    });
    expect(number).toBe('OPS-123');
    expect(supabase.rpc).toHaveBeenCalledWith('create_online_operations_order', {
      p_site_id: 'warehouse-1', p_customer_name: 'Ada Buyer', p_customer_phone: '0712345678',
      p_delivery_address: 'Market Road 12', p_items: [{ product_id: 'product-1', quantity: 2 }],
    });
  });

  it('sends acceptance through the atomic decision RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'pick-job-1', error: null } as never);
    await onlineStoreService.updateOrderStatus('order-1', 'accepted');
    expect(supabase.rpc).toHaveBeenCalledWith('decide_storefront_order', {
      p_order_id: 'order-1', p_decision: 'accepted',
    });
  });

  it('propagates a failed reservation instead of reporting acceptance', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('Warehouse stock is insufficient') } as never);
    await expect(onlineStoreService.updateOrderStatus('order-2', 'accepted'))
      .rejects.toThrow('Warehouse stock is insufficient');
  });
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
