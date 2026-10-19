import { describe, expect, it } from 'vitest';
import { checkIsLocalhost, isStagingQuickLoginAvailable } from '../../utils/stagingQuickLogin';

const staging = 'https://utykzifrblpyxlvlknsm.supabase.co';
describe('staging quick login availability', () => {
    it.each(['localhost', '127.0.0.1', '::1', '[::1]', 'app.localhost'])('allows local development on %s', host => {
        expect(checkIsLocalhost(host, true)).toBe(true);
        expect(checkIsLocalhost(host, false)).toBe(false);
        expect(isStagingQuickLoginAvailable(host, true, staging)).toBe(true);
    });
    it.each(['', 'siifmart.com', 'localhost.evil.com', 'siifmart.vercel.app', '192.168.1.10'])('rejects remote host %s', host => {
        expect(isStagingQuickLoginAvailable(host, true, staging)).toBe(false);
    });
    it('rejects a main project even on localhost', () => {
        expect(isStagingQuickLoginAvailable('localhost', true, 'https://zdgzpxvorwinugjufkvb.supabase.co')).toBe(false);
    });
});
