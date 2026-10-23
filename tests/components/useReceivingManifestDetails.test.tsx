// @vitest-environment jsdom
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ effectiveCountry: 'ET', activeSite: { id: 'site-1' } }) }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { id: 'receiver', role: 'receiver', siteId: 'site-1' } }) }));
vi.mock('../../services/purchase-orders.service', () => ({ purchaseOrdersService: { getById: vi.fn() } }));
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { useReceivingManifestDetails } from '../../hooks/useReceivingManifestDetails';
import type { PurchaseOrder } from '../../types';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const summary = { id: 'po-1', siteId: 'site-1', countryCode: 'ET', status: 'Approved', itemsCount: 1, lineItems: [] } as unknown as PurchaseOrder;
function setup(orders = [summary]) {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 return renderHook(() => useReceivingManifestDetails(orders), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
describe('on-demand receiving manifests', () => {
 it('loads authoritative items only after the manifest is opened', async () => {
  const detail = { ...summary, lineItems: [{ productName: 'Juice', quantity: 20 }] } as PurchaseOrder;
  vi.mocked(purchaseOrdersService.getById).mockResolvedValue(detail);
  const { result } = setup();
  expect(purchaseOrdersService.getById).not.toHaveBeenCalled();
  act(() => result.current.loadManifest('po-1'));
  await waitFor(() => expect(result.current.orders[0].lineItems).toHaveLength(1));
  expect(purchaseOrdersService.getById).toHaveBeenCalledWith('po-1');
 });
 it('does not request a different destination site', () => {
  const { result } = setup([{ ...summary, siteId: 'other-site' }]);
  act(() => result.current.loadManifest('po-1'));
  expect(purchaseOrdersService.getById).not.toHaveBeenCalled();
 });
 it('reports failed reads and lets the worker retry', async () => {
  vi.mocked(purchaseOrdersService.getById).mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce({ ...summary, lineItems: [{ productName: 'Juice', quantity: 20 }] } as PurchaseOrder);
  const { result } = setup();
  act(() => result.current.loadManifest('po-1'));
  await waitFor(() => expect(result.current.manifestError('po-1')).toContain('Try again'));
  act(() => result.current.loadManifest('po-1'));
  await waitFor(() => expect(result.current.orders[0].lineItems).toHaveLength(1));
 });
});
