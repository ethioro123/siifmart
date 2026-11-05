import { beforeEach, expect, it, vi } from 'vitest';
import { regionalAdminDirectoryService } from '../../services/regional-admin-directory.service';
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from } }));
beforeEach(() => { from.mockReset(); });
it('loads a dedicated country directory in pages, independently of the active-site cache', async () => {
    const eq = vi.fn(); const range = vi.fn(); const chain = { select: vi.fn(), eq, order: vi.fn(), range, in: vi.fn() };
    for (const fn of [chain.select, eq, chain.order, chain.in]) fn.mockReturnValue(chain);
    from.mockReturnValue(chain);
    const sites = Array.from({ length: 100 }, (_, i) => ({ id: String(i), country: 'ET', region_code: 'ADD' }));
    range.mockResolvedValueOnce({ data: sites, error: null }).mockResolvedValueOnce({ data: [{ id: 'last', country: 'ET', region_code: 'ADA' }], error: null })
        .mockResolvedValueOnce({ data: [{ id: 'manager', name: 'Manager', site_id: 'last', role: 'regional_operations_manager', status: 'Active', region_code: null }], error: null });
    const data = await regionalAdminDirectoryService.load('ET');
    expect(data.sites).toHaveLength(101);
    expect(eq).toHaveBeenCalledWith('country', 'ET');
    expect(range).toHaveBeenNthCalledWith(2, 100, 199);
    expect(data.employees[0].regionCode).toBe('ADA');
});
it('reports directory failures instead of displaying missing assignments as fact', async () => {
    const error = new Error('Directory unavailable');
    const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn().mockResolvedValue({ data: null, error }) };
    for (const fn of [chain.select, chain.eq, chain.order]) fn.mockReturnValue(chain);
    from.mockReturnValue(chain);
    await expect(regionalAdminDirectoryService.load('ET')).rejects.toBe(error);
});
