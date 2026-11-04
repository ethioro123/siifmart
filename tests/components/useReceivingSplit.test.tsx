// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product, PurchaseOrder, WMSJob, SystemConfig } from '../../types';
const mocks = vi.hoisted(() => ({
 load: vi.fn(), save: vi.fn(), update: vi.fn(), updatePrice: vi.fn(), aliases: vi.fn(), detail: vi.fn(),
 match: vi.fn(), route: vi.fn()
}));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../utils/receivingPOItem', () => ({ loadReceivingPOItem: mocks.load }));
vi.mock('../../services/receiving-transaction.service', () => ({ receivingTransactionService: { save: mocks.save } }));
vi.mock('../../services/supabase.service', () => ({
 productsService: { update: mocks.update, updatePriceBySku: mocks.updatePrice },
 purchaseOrdersService: { getById: mocks.detail }
}));
vi.mock('../../services/products/product-master.service', () => ({ syncProductAliases: mocks.aliases }));
vi.mock('../../components/fulfillment/receivingSplitHelpers', () => ({
 findMatchingProduct: mocks.match, resolveSmartPutawayLocation: mocks.route, cleanSku: (v: string) => v
}));
vi.mock('../../components/fulfillment/useReceiving', () => ({ convertToSellableUnits: (qty: number) => qty }));
import { useReceivingSplit } from '../../components/fulfillment/useReceivingSplit';
const product = { id: 'product', sku: 'ETDI001', siteId: 'warehouse', stock: 12, price: 10 } as Product;
const item = { id: 'item', productId: 'product', sku: 'ETDI001', productName: 'Dishes', quantity: 20, totalCost: 400,
 receivedQty: 0, unitCost: 20, retailPrice: 30, brand: 'Supplier brand', barcode: 'old-barcode' };
const po: PurchaseOrder = { supplierId: 'supplier', supplierName: 'Supplier', date: '2026-11-05', totalAmount: 400, itemsCount: 1, expectedDelivery: null, id: 'po', siteId: 'warehouse', country_code: 'ET', status: 'Approved', lineItems: [item] };
beforeEach(() => {
 vi.clearAllMocks();
 mocks.load.mockResolvedValue({ po, item, itemIndex: 0 });
 mocks.match.mockResolvedValue({ localProduct: product });
 mocks.route.mockResolvedValue('B-01');
 mocks.detail.mockResolvedValue(po);
 mocks.save.mockImplementation(async (_request, _po, _item, _previous, jobs: Array<Omit<WMSJob, 'id'>>) => jobs.map(job => ({ ...job, id: 'saved-job' })));
});
function setup() {
 const setJobs = vi.fn(), notify = vi.fn(), setProducts = vi.fn();
 const hook = renderHook(() => useReceivingSplit({
  orders: [po], allOrders: [po], jobs: [], products: [product], allProducts: [product],
  activeSite: { id: 'warehouse', country: 'ET' }, setJobs, setOrders: vi.fn(), setAllOrders: vi.fn(),
  addNotification: notify, setProducts, settings: { country: 'ET', poPriceApplyAt: 'receive' } as SystemConfig
 }));
 return { ...hook, setJobs, notify, setProducts };
}
const variants = [{ sku: 'ETDI001', skuType: 'existing' as const, productId: 'product', quantity: 4,
 barcode: 'observed-barcode', barcodes: ['observed-alias'], batchNumber: 'LOT-1', expiryDate: '2027-01-01' }];
describe('receiving existing catalog products', () => {
 it('saves the physical receipt and incoming lot evidence without catalog, alias or pricing writes', async () => {
  const { result, setJobs, setProducts } = setup();
  await act(async () => { await result.current.receivePOSplit('po', 'item', variants); });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.updatePrice).not.toHaveBeenCalled();
  expect(mocks.aliases).not.toHaveBeenCalled();
  expect(setProducts).not.toHaveBeenCalled();
  expect(mocks.save).toHaveBeenCalledWith(expect.any(String), 'po', 'item', 0, [expect.objectContaining({
   siteId: 'warehouse', country_code: 'ET', type: 'PUTAWAY',
   lineItems: [expect.objectContaining({ productId: 'product', expectedQty: 4, barcode: 'observed-barcode',
    barcodes: ['observed-alias'], batchNumber: 'LOT-1', expiryDate: '2027-01-01', retailPrice: 30 })]
  })]);
  expect(setJobs).toHaveBeenCalledOnce();
  expect(product.stock).toBe(12);
 });
 it('propagates a rejected receipt and does not create local jobs', async () => {
  mocks.save.mockRejectedValueOnce(new Error('Receipt refused'));
  const { result, setJobs, notify } = setup();
  await act(async () => { await expect(result.current.receivePOSplit('po', 'item', variants)).rejects.toThrow('Receipt refused'); });
  expect(setJobs).not.toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith('alert', 'Receipt refused');
 });
});
