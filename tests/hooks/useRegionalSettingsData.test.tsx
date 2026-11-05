// @vitest-environment jsdom
import React from 'react';
import { expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegionalSettingsData } from '../../hooks/useRegionalSettingsData';
import type { Region } from '../../types';
const { getRegions, load } = vi.hoisted(() => ({ getRegions: vi.fn(), load: vi.fn() }));
vi.mock('../../services/regions.service', () => ({ regionsService: { getRegions } }));
vi.mock('../../services/regional-admin-directory.service', () => ({ regionalAdminDirectoryService: { load } }));
it('keeps a delayed old-country response out of the newly selected country', async () => {
    let resolveET!: (regions: Region[]) => void;
    const pending = new Promise<Region[]>(resolve => { resolveET = resolve; });
    getRegions.mockImplementation((country: string) => country === 'ET' ? pending : Promise.resolve([{ code: 'NRB', country: 'KE' }]));
    load.mockResolvedValue({ sites: [], employees: [] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender, unmount } = renderHook(({ country }) => useRegionalSettingsData('actor', country), { wrapper, initialProps: { country: 'ET' } });
    rerender({ country: 'KE' });
    await waitFor(() => expect(result.current.regions.data?.[0].code).toBe('NRB'));
    resolveET([{ code: 'ADD', country: 'ET' } as Region]);
    await waitFor(() => expect(client.getQueryData<Region[]>(['regions', 'settings', 'actor', 'ET'])?.[0].code).toBe('ADD'));
    expect(result.current.regions.data?.[0].code).toBe('NRB');
    expect(load).toHaveBeenCalledWith('KE');
    unmount(); client.clear();
});
