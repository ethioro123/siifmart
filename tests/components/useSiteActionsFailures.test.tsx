// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSiteActions } from '../../contexts/hooks/useSiteActions';
import type { Site, SystemConfig } from '../../types';
const { sitesService } = vi.hoisted(() => ({ sitesService: { create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock('../../services/supabase.service', () => ({ sitesService, systemConfigService: {} }));
it('propagates create, edit and delete failures so callers cannot report success', async () => {
    const error = new Error('Save denied');
    for (const fn of Object.values(sitesService)) fn.mockRejectedValue(error);
    const setSites = vi.fn();
    const { result } = renderHook(() => useSiteActions({ sites: [], activeSiteId: '', settings: {} as SystemConfig,
        setSites, setSettings: vi.fn(), setActiveSiteId: vi.fn(), addNotification: vi.fn(), logSystemEvent: vi.fn() }));
    await expect(result.current.addSite({ id: 'site', name: 'Site', country: 'ET', type: 'Store' } as Site, 'Actor')).rejects.toBe(error);
    await expect(result.current.updateSite({ id: 'site', name: 'Site' } as Site, 'Actor')).rejects.toBe(error);
    await expect(result.current.deleteSite('site', 'Actor')).rejects.toBe(error);
    expect(setSites).not.toHaveBeenCalled();
});
