import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../services/purchase-orders.service', () => ({ purchaseOrdersService: { getById: vi.fn() } }));
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { loadReceivingPOItem } from '../../utils/receivingPOItem';
import type { PurchaseOrder } from '../../types';
const po = { id: 'po', siteId: 'dc', country_code: 'ET', status: 'Approved', lineItems: [
 { id: 'line-a', productId: 'product', sku: 'ET001', receivedQty: 3 },
 { id: 'line-b', productId: 'product', sku: 'ET001', receivedQty: 9 }
] } as PurchaseOrder;
beforeEach(() => { vi.clearAllMocks(); vi.mocked(purchaseOrdersService.getById).mockResolvedValue(po); });
describe('authoritative receipt item lookup', () => {
 it('reloads detail and selects the exact line, including fresh received counts', async () => {
  const result = await loadReceivingPOItem('po', 'line-b', 'dc', 'ET');
  expect(purchaseOrdersService.getById).toHaveBeenCalledWith('po');
  expect(result.itemIndex).toBe(1); expect(result.item.receivedQty).toBe(9);
 });
 it('supports an unambiguous legacy product identifier', async () => {
  vi.mocked(purchaseOrdersService.getById).mockResolvedValue({ ...po, lineItems: [po.lineItems![0]] });
  expect((await loadReceivingPOItem('po', 'product', 'dc', 'ET')).item.id).toBe('line-a');
 });
 it('throws for missing or ambiguous items so the modal cannot report a false save', async () => {
  await expect(loadReceivingPOItem('po', 'missing', 'dc', 'ET')).rejects.toThrow('no longer present');
  await expect(loadReceivingPOItem('po', 'product', 'dc', 'ET')).rejects.toThrow('specific PO line');
 });
 it('rejects foreign facilities, countries, and closed orders', async () => {
  await expect(loadReceivingPOItem('po', 'line-a', 'other', 'ET')).rejects.toThrow('outside');
  await expect(loadReceivingPOItem('po', 'line-a', 'dc', 'KE')).rejects.toThrow('outside');
  vi.mocked(purchaseOrdersService.getById).mockResolvedValue({ ...po, status: 'Received' });
  await expect(loadReceivingPOItem('po', 'line-a', 'dc', 'ET')).rejects.toThrow('not open');
 });
 it('propagates detail-read failures before any receipt work starts', async () => {
  vi.mocked(purchaseOrdersService.getById).mockRejectedValue(new Error('Connection failed'));
  await expect(loadReceivingPOItem('po', 'line-a', 'dc', 'ET')).rejects.toThrow('Connection failed');
 });
});
