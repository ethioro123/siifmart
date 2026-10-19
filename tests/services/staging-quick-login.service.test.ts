import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { stagingQuickLoginService } from '../../services/staging-quick-login.service';

vi.mock('../../lib/supabase', () => ({ supabase: { auth: { setSession: vi.fn(), signInWithPassword: vi.fn() } } }));
beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_SUPABASE_URL', 'https://utykzifrblpyxlvlknsm.supabase.co');
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('staging sign-in service', () => {
    it('uses the server-provided session without receiving or submitting a password', async () => {
        const session = { access_token: 'test-access', refresh_token: 'test-refresh' };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ session })));
        vi.stubGlobal('fetch', fetchMock);
        vi.mocked(supabase.auth.setSession).mockResolvedValue({ error: null } as Awaited<ReturnType<typeof supabase.auth.setSession>>);
        await stagingQuickLoginService.signIn('test@staging.siifmart.com');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'test@staging.siifmart.com' });
        expect(supabase.auth.setSession).toHaveBeenCalledWith(session);
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
    it('makes no request when localhost is configured for main', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://zdgzpxvorwinugjufkvb.supabase.co');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(stagingQuickLoginService.getAccounts()).rejects.toThrow('local staging only');
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it('propagates a denied sign-in without replacing the current session', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Denied' }), { status: 403 })));
        await expect(stagingQuickLoginService.signIn('test@staging.siifmart.com')).rejects.toThrow('Denied');
        expect(supabase.auth.setSession).not.toHaveBeenCalled();
    });
});
