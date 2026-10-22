import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import { isLocalQuickLoginRequest } from '../../dev/stagingQuickLoginPolicy';
import { stagingQuickLoginPlugin } from '../../dev/stagingQuickLoginPlugin';
import { isStagingExecutive, isStagingTestEmail } from '../../supabase/functions/staging-quick-login/policy';

function request(origin?: string, remoteAddress = '127.0.0.1', host = 'localhost:3000') {
    return { method: 'POST', headers: { origin, host }, socket: { remoteAddress } as Socket } satisfies Pick<IncomingMessage, 'method' | 'headers' | 'socket'>;
}
describe('staging session bridge boundaries', () => {
    it('requires a loopback connection and matching Origin for sign-in', () => {
        expect(isLocalQuickLoginRequest(request('http://localhost:3000'))).toBe(true);
        expect(isLocalQuickLoginRequest(request())).toBe(false);
        expect(isLocalQuickLoginRequest(request('https://evil.example'))).toBe(false);
        expect(isLocalQuickLoginRequest(request('http://localhost:3000', '192.168.1.10'))).toBe(false);
        expect(isLocalQuickLoginRequest(request('http://evil.example', '127.0.0.1', 'evil.example'))).toBe(false);
    });
    it('registers no privileged middleware when configured for main', () => {
        const use = vi.fn();
        const plugin = stagingQuickLoginPlugin({ url: 'https://zdgzpxvorwinugjufkvb.supabase.co', publicKey: 'test-public' });
        const configure = plugin.configureServer as (server: unknown) => void;
        configure({ middlewares: { use } });
        expect(use).not.toHaveBeenCalled();
    });
    it('accepts fixture domains and trusted executive roles only', () => {
        expect(isStagingTestEmail('test.picker@role-coverage.staging.siifmart.invalid')).toBe(true);
        expect(isStagingTestEmail('admin@staging.siifmart.com')).toBe(true);
        expect(isStagingTestEmail('real@siifmart.com')).toBe(false);
        expect(isStagingTestEmail('test@staging.siifmart.com.evil.example')).toBe(false);
        expect(isStagingExecutive('group_ceo')).toBe(true);
        expect(isStagingExecutive('warehouse_manager')).toBe(false);
        expect(isStagingExecutive('admin')).toBe(false);
    });
});
