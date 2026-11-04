// @vitest-environment jsdom
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useFacilityZones } from '../../hooks/useFacilityZones';
import { warehouseZonesService } from '../../services/zones.service';
vi.mock('../../services/zones.service', () => ({ warehouseZonesService: { getAll: vi.fn() } }));
const wrapper = ({ children }: { children: React.ReactNode }) => {
    const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retryDelay: 0, gcTime: 0 } } }));
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
it('loads the saved facility layout without needing jobs, transfers or approvals', async () => {
    vi.mocked(warehouseZonesService.getAll).mockResolvedValue([{ id: 'zone-b', name: 'Zone B', siteId: 'ada' }] as never[]);
    const { result } = renderHook(() => useFacilityZones('ada', 'ET', 'user'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(warehouseZonesService.getAll).toHaveBeenCalledWith('ada');
    expect(result.current.data?.[0].name).toBe('Zone B');
});
it('does not reuse the previous facility layout after a switch', async () => {
    vi.mocked(warehouseZonesService.getAll).mockResolvedValueOnce([{ id: 'zone-b', name: 'Zone B', siteId: 'ada' }] as never[])
        .mockImplementationOnce(() => new Promise(() => {}));
    const { result, rerender } = renderHook(({ site }) => useFacilityZones(site, 'ET', 'user'), { wrapper, initialProps: { site: 'ada' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ site: 'add' });
    expect(result.current.data).toBeUndefined();
});
it('keeps failed reads distinguishable from an empty configured layout', async () => {
    vi.mocked(warehouseZonesService.getAll).mockRejectedValue(new Error('Read denied'));
    const { result } = renderHook(() => useFacilityZones('ada', 'ET', 'user'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
});
it('does not query before a facility, country and user are available', () => {
    renderHook(() => useFacilityZones(undefined, '', undefined), { wrapper });
    expect(warehouseZonesService.getAll).not.toHaveBeenCalled();
});
