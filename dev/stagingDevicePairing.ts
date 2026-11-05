import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isLocalQuickLoginRequest } from './stagingQuickLoginPolicy';
import { isPrivateNetworkHost } from '../utils/privateNetworkHost';

export const PAIRING_CODE_TTL_MS = 5 * 60 * 60 * 1000;

type Request = Pick<IncomingMessage, 'headers' | 'socket' | 'method'>;
function privateRequest(request: Request): boolean {
    if (!isPrivateNetworkHost(request.socket.remoteAddress || '')) return false;
    try {
        const target = new URL(`http://${request.headers.host}`);
        if (!isPrivateNetworkHost(target.hostname) || request.headers['sec-fetch-site'] === 'cross-site') return false;
        if (request.method === 'POST' && !request.headers.origin) return false;
        return !request.headers.origin || new URL(request.headers.origin).origin === target.origin;
    } catch { return false; }
}
const reply = (response: ServerResponse, status: number, body: unknown) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(JSON.stringify(body));
};
export function createStagingDevicePairing(now = Date.now) {
    let code: { value: string; expires: number; attempts: number } | undefined;
    const devices = new Map<string, { peer: string; host: string; expires: number }>();
    const prune = () => { for (const [key, device] of devices) if (device.expires <= now()) devices.delete(key); };
    const authorized = (request: Request) => {
        if (isLocalQuickLoginRequest(request)) return true;
        if (!privateRequest(request)) return false;
        prune();
        const token = request.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('siifmart_staging_device='))?.split('=')[1];
        const device = token ? devices.get(token) : undefined;
        return !!device && device.peer === request.socket.remoteAddress && device.host === request.headers.host;
    };
    return {
        authorized,
        async handle(request: IncomingMessage, response: ServerResponse, path: string): Promise<boolean> {
            if (!['/pair-code', '/pair-device', '/pair-status'].includes(path)) return false;
            const local = isLocalQuickLoginRequest(request);
            if (!local && !privateRequest(request)) { reply(response, 403, { error: 'Local staging access required' }); return true; }
            if (path === '/pair-status' && request.method === 'GET') { reply(response, 200, { paired: authorized(request) }); return true; }
            if (path === '/pair-code' && request.method === 'POST' && local) {
                code = { value: String(randomInt(10_000_000, 100_000_000)), expires: now() + PAIRING_CODE_TTL_MS, attempts: 0 };
                reply(response, 200, { code: code.value }); return true;
            }
            if (path !== '/pair-device' || request.method !== 'POST' || !request.headers['content-type']?.startsWith('application/json')) {
                reply(response, 403, { error: 'Pair this device from localhost first' }); return true;
            }
            let body = '';
            for await (const chunk of request) {
                body += chunk;
                if (body.length > 128) { reply(response, 413, { error: 'Request too large' }); return true; }
            }
            let supplied: unknown;
            try { supplied = JSON.parse(body).code; } catch { reply(response, 400, { error: 'Enter the pairing code' }); return true; }
            const current = code;
            if (current) current.attempts++;
            if (!current || current.expires <= now() || current.attempts > 8 || typeof supplied !== 'string'
                || !/^\d{8}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(current.value))) {
                reply(response, 403, { error: 'Pairing code is invalid or expired' }); return true;
            }
            prune();
            if (devices.size >= 8) { reply(response, 429, { error: 'Device limit reached; restart staging to clear paired devices' }); return true; }
            code = undefined;
            const token = randomBytes(32).toString('hex');
            devices.set(token, { peer: request.socket.remoteAddress || '', host: request.headers.host || '', expires: now() + 7_200_000 });
            response.setHeader('Set-Cookie', `siifmart_staging_device=${token}; HttpOnly; SameSite=Strict; Path=/__staging; Max-Age=7200`);
            reply(response, 200, { paired: true }); return true;
        }
    };
}
