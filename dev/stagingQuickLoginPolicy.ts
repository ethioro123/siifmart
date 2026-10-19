import type { IncomingMessage } from 'node:http';

export const isLoopbackHost = (host: string): boolean =>
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host) || host.endsWith('.localhost');

export function isLocalQuickLoginRequest(request: Pick<IncomingMessage, 'headers' | 'socket' | 'method'>): boolean {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress || '')) return false;
    try {
        const target = new URL(`http://${request.headers.host}`);
        if (!isLoopbackHost(target.hostname) || request.headers['sec-fetch-site'] === 'cross-site') return false;
        const origin = request.headers.origin;
        if (request.method === 'POST' && !origin) return false;
        return !origin || new URL(origin).origin === target.origin;
    } catch { return false; }
}
