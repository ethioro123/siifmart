import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { beforeEach, expect, it, vi } from 'vitest';
import { createStagingDevicePairing, PAIRED_DEVICE_TTL_MS, PAIRING_CODE_TTL_MS } from '../../dev/stagingDevicePairing';
import { isPrivateNetworkHost } from '../../utils/privateNetworkHost';

const request = (local = false, body?: unknown, overrides: Record<string, unknown> = {}) => Object.assign(Readable.from(body ? [JSON.stringify(body)] : []), {
    method: body ? 'POST' : 'GET', socket: { remoteAddress: local ? '127.0.0.1' : '192.168.0.25' },
    headers: { host: local ? 'localhost:3000' : '192.168.0.241:3000', origin: local ? 'http://localhost:3000' : 'http://192.168.0.241:3000', 'content-type': 'application/json', ...overrides }
}) as unknown as IncomingMessage;
function response() {
    const headers = new Map<string, string>();
    let status = 0; let body: { code?: string; paired?: boolean } = {};
    return { headers, get status() { return status; }, get body() { return body; },
        raw: { setHeader: (k: string, v: string) => headers.set(k, v), writeHead: (s: number) => { status = s; }, end: (v: string) => { body = JSON.parse(v); } } as unknown as ServerResponse };
}
let clock = 1000;
beforeEach(() => { clock = 1000; vi.clearAllMocks(); });
async function pair() {
    const service = createStagingDevicePairing(() => clock);
    const code = response(); const local = request(true, {});
    await service.handle(local, code.raw, '/pair-code');
    const mobile = response(); await service.handle(request(false, { code: code.body.code }), mobile.raw, '/pair-device');
    const cookie = mobile.headers.get('Set-Cookie')?.split(';')[0];
    return { service, cookie, code: code.body.code, mobile };
}
it('requires local generation, then binds access to the paired device and host', async () => {
    const { service, cookie, mobile } = await pair();
    expect(mobile.status).toBe(200);
    expect(service.authorized(request(false))).toBe(false);
    expect(service.authorized(request(false, undefined, { cookie }))).toBe(true);
    const other = request(false, undefined, { cookie }); Object.assign(other.socket, { remoteAddress: '192.168.0.26' });
    expect(service.authorized(other)).toBe(false);
    expect(service.authorized(request(false, undefined, { cookie, origin: 'https://evil.example' }))).toBe(false);
    expect(mobile.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Strict');
});
it('rejects public hosts, remote code generation and replay of a used code', async () => {
    const { service, code } = await pair();
    const denied = response(); await service.handle(request(false, {}), denied.raw, '/pair-code');
    expect(denied.status).toBe(403);
    const replay = response(); await service.handle(request(false, { code }), replay.raw, '/pair-device');
    expect(replay.status).toBe(403);
    expect(service.authorized(request(false, undefined, { host: 'public.example', origin: 'http://public.example' }))).toBe(false);
});
it('expires paired access after five hours and clears it on restart', async () => {
    const { service, cookie, mobile } = await pair();
    expect(mobile.headers.get('Set-Cookie')).toContain('Max-Age=18000');
    clock += PAIRED_DEVICE_TTL_MS - 1;
    expect(service.authorized(request(false, undefined, { cookie }))).toBe(true);
    clock += 1;
    expect(service.authorized(request(false, undefined, { cookie }))).toBe(false);
    expect(createStagingDevicePairing().authorized(request(false, undefined, { cookie }))).toBe(false);
});
it('expires codes after five minutes and limits guesses', async () => {
    const service = createStagingDevicePairing(() => clock); const code = response();
    await service.handle(request(true, {}), code.raw, '/pair-code');
    for (let n = 0; n < 8; n++) await service.handle(request(false, { code: 'invalid' }), response().raw, '/pair-device');
    const denied = response(); await service.handle(request(false, { code: code.body.code }), denied.raw, '/pair-device');
    expect(denied.status).toBe(403);
    await service.handle(request(true, {}), code.raw, '/pair-code'); clock += PAIRING_CODE_TTL_MS + 1;
    const expired = response(); await service.handle(request(false, { code: code.body.code }), expired.raw, '/pair-device');
    expect(expired.status).toBe(403);
});
it('recognizes literal private networks and rejects public or malformed hosts', () => {
    for (const host of ['192.168.0.241','10.1.2.3','172.16.0.1','::ffff:192.168.0.25']) expect(isPrivateNetworkHost(host)).toBe(true);
    for (const host of ['8.8.8.8','172.32.1.1','192.168.0.999','192.168.001.2','evil.example']) expect(isPrivateNetworkHost(host)).toBe(false);
});
