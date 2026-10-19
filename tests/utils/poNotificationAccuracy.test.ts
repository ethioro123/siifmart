// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { usePOActions } from '../../contexts/hooks/usePOActions';
import type { PurchaseOrder } from '../../types';

const service = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), delete: vi.fn() }));
vi.mock('../../services/supabase.service', () => ({ purchaseOrdersService: service }));
vi.mock('../../utils/logger', () => ({ logger: { debug: vi.fn(), error: vi.fn() } }));

const po = { id: 'po-1', siteId: 'site-a', lineItems: [] } as unknown as PurchaseOrder;
const makeDeps = () => ({
  activeSite: undefined, activeSiteId: 'site-a',
  setOrders: vi.fn(), setAllOrders: vi.fn(), addNotification: vi.fn(), logSystemEvent: vi.fn()
});
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('PO save-result notifications', () => {
  it('does not report success until creation is confirmed', async () => {
    let confirm!: (value: PurchaseOrder) => void;
    service.create.mockReturnValue(new Promise<PurchaseOrder>(resolve => { confirm = resolve; }));
    const deps = makeDeps();
    const { result } = renderHook(() => usePOActions(deps));
    const creation = result.current.createPO(po);
    expect(deps.addNotification).not.toHaveBeenCalled();
    expect(deps.setOrders).not.toHaveBeenCalled();
    confirm(po);
    await expect(creation).resolves.toEqual(po);
    expect(deps.addNotification).toHaveBeenCalledWith('success', expect.stringContaining('created successfully'));
  });

  it('propagates creation failure without inserting a fake local order', async () => {
    const error = new Error('save rejected');
    service.create.mockRejectedValue(error);
    const deps = makeDeps();
    const { result } = renderHook(() => usePOActions(deps));
    await expect(result.current.createPO(po)).rejects.toBe(error);
    expect(deps.setOrders).not.toHaveBeenCalled();
    expect(deps.setAllOrders).not.toHaveBeenCalled();
    expect(deps.addNotification).toHaveBeenCalledTimes(1);
    expect(deps.addNotification).toHaveBeenCalledWith('alert', expect.stringContaining('not confirmed'));
  });

  it.each(['update', 'delete'] as const)('propagates %s failure so callers cannot report success', async operation => {
    const error = new Error('write rejected');
    service[operation].mockRejectedValue(error);
    const deps = makeDeps();
    const { result } = renderHook(() => usePOActions(deps));
    const pending = operation === 'update' ? result.current.updatePO(po) : result.current.deletePO(po.id);
    await expect(pending).rejects.toBe(error);
    expect(deps.setOrders).not.toHaveBeenCalled();
    expect(deps.addNotification).toHaveBeenCalledWith('alert', expect.any(String));
    expect(deps.addNotification).not.toHaveBeenCalledWith('success', expect.anything());
  });
});
