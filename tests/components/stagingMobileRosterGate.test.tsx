// @vitest-environment jsdom
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useStagingAccounts } from '../../hooks/useStagingQuickLogin';
import { stagingQuickLoginService } from '../../services/staging-quick-login.service';
vi.mock('../../services/staging-quick-login.service', () => ({ stagingQuickLoginService: { pairingStatus: vi.fn(), getAccounts: vi.fn() } }));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('does not request the roster until the LAN device is paired', async () => {
    vi.stubEnv('DEV', true); vi.stubEnv('VITE_SUPABASE_URL', 'https://utykzifrblpyxlvlknsm.supabase.co');
    vi.mocked(stagingQuickLoginService.pairingStatus).mockResolvedValue({ paired: false });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    renderHook(() => useStagingAccounts(), { wrapper });
    await waitFor(() => expect(client.getQueryData(['staging-device-pairing'])).toEqual({ paired: false }));
    expect(stagingQuickLoginService.getAccounts).not.toHaveBeenCalled();
    client.clear();
});
