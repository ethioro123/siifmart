// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../utils/printHelper', () => ({ printHtmlContent: vi.fn() }));
vi.mock('../../utils/labels/InboundPutawayLabelGenerator', () => ({ generateInboundPutawayLabelHTML: vi.fn().mockResolvedValue('<html>pallet</html>') }));
vi.mock('../../utils/labels/ProductLabelGenerator', () => ({ generateUnifiedBatchLabelsHTML: vi.fn().mockResolvedValue('<html>item</html>') }));
import { printHtmlContent } from '../../utils/printHelper';
import { generateInboundPutawayLabelHTML } from '../../utils/labels/InboundPutawayLabelGenerator';
import { generateUnifiedBatchLabelsHTML } from '../../utils/labels/ProductLabelGenerator';
import { useReceivingLabelPrinting } from '../../hooks/useReceivingLabelPrinting';
import { buildReceivingPalletLabels } from '../../utils/receivingLabelData';
const item = { sku: 'ETBB002', name: 'Diaper', qty: 24, copies: 2, batchNumber: 'LOT-A', expiry: '2027-01-01', condition: 'Damaged' };
const config = { products: [], allProducts: [], country: 'ET', user: null, receivingPO: null, size: 'MEDIUM', format: 'Both' as const,
 options: { showPrice: true, showCategory: true, showName: true }, allowPrice: false, setIsSubmitting: vi.fn(), addNotification: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(printHtmlContent).mockResolvedValue({ success: true }); });
describe('receiving label printing', () => {
 it('prints one pallet label per copy while preserving physical quantity and draft status', async () => {
  const { result } = renderHook(() => useReceivingLabelPrinting(config));
  expect(await result.current([item])).toBe(true);
  const labels = vi.mocked(generateInboundPutawayLabelHTML).mock.calls[0][0];
  expect(labels).toHaveLength(2);
  expect(labels[0]).toMatchObject({ quantity: 24, batchNumber: 'LOT-A', expiryDate: '2027-01-01', condition: 'COUNTED · NOT SAVED' });
  expect(config.addNotification).toHaveBeenCalledWith('info', expect.stringContaining('print dialog'));
 });
 it('does not mark damaged receipts as QC passed', () => {
  expect(buildReceivingPalletLabels([{ ...item, receiptSaved: true }])[0].condition).toBe('RECEIVED · Damaged');
 });
 it('uses normalized size, requested copies, and country price policy for unit stickers', async () => {
  const { result } = renderHook(() => useReceivingLabelPrinting(config));
  await result.current([item], 'ITEM');
  expect(generateUnifiedBatchLabelsHTML).toHaveBeenCalledWith([expect.objectContaining({ quantity: 2, currency: 'ETB' })], expect.objectContaining({ size: 'Medium', showPrice: false }));
 });
 it('returns failure so reprint stays open for retry', async () => {
  vi.mocked(printHtmlContent).mockResolvedValue({ success: false, error: 'Printer unavailable' });
  const { result } = renderHook(() => useReceivingLabelPrinting(config));
  expect(await result.current([item])).toBe(false);
  expect(config.addNotification).toHaveBeenCalledWith('alert', 'Printer unavailable');
  expect(config.setIsSubmitting).toHaveBeenLastCalledWith(false);
 });
 it('rejects invalid SKU, count, and copies before opening printing', async () => {
  const { result } = renderHook(() => useReceivingLabelPrinting(config));
  for (const invalid of [{ ...item, sku: 'UNKNOWN' }, { ...item, qty: 0 }, { ...item, copies: 0 }, { ...item, copies: 1.5 }]) expect(await result.current([invalid])).toBe(false);
  expect(printHtmlContent).not.toHaveBeenCalled();
 });
});
