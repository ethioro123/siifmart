import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { authService, type UserProfile } from '../../services/auth.service';
import { employeesService } from '../../services/supabase.service';
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } } }));
vi.mock('../../services/supabase.service', () => ({ employeesService: { getByEmail: vi.fn() } }));
vi.mock('../../services/local-logs.service', () => ({ systemLogsService: { logSecurity: vi.fn() } }));
const current: User = { id: 'worker-b', email: 'worker-b@example.invalid', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };
const cached: UserProfile = { id: 'worker-a', employeeId: 'worker-a', email: 'worker-a@example.invalid', name: 'Previous worker', role: 'group_ceo' };
beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => JSON.stringify(cached)), setItem: vi.fn(), removeItem: vi.fn() });
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(current);
    vi.mocked(employeesService.getByEmail).mockReset();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('does not return another worker from cache after an online profile failure', async () => {
    vi.mocked(employeesService.getByEmail).mockRejectedValue(new Error('Profile unavailable'));
    expect(await authService.getCurrentAuthUser()).toBeNull();
});
it('does not restore any cached identity without a current offline session', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    vi.mocked(authService.getCurrentUser).mockResolvedValue(null);
    expect(await authService.getCurrentAuthUser()).toBeNull();
});
it('rejects another worker cache offline instead of falling back after a failed lookup', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    vi.mocked(employeesService.getByEmail).mockRejectedValue(new Error('Offline'));
    expect(await authService.getCurrentAuthUser()).toBeNull();
});
it('retains offline access only for the matching session identity', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ ...current, id: cached.id });
    expect(await authService.getCurrentAuthUser()).toEqual(cached);
    expect(employeesService.getByEmail).not.toHaveBeenCalled();
});
it('rejects a database profile belonging to a different auth identity', async () => {
    vi.mocked(employeesService.getByEmail).mockResolvedValue({ id: 'worker-a', name: 'Previous worker', role: 'group_ceo', status: 'Active' } as never);
    expect(await authService.getCurrentAuthUser()).toBeNull();
});
it('loads and caches a verified active employee matching the current session', async () => {
    vi.mocked(employeesService.getByEmail).mockResolvedValue({ id: current.id, name: 'Current worker', role: 'picker', status: 'Active', siteId: 'warehouse-b' } as never);
    expect(await authService.getCurrentAuthUser()).toMatchObject({ id: current.id, employeeId: current.id, role: 'picker', siteId: 'warehouse-b' });
});
