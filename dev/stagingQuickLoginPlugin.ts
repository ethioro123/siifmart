import { createClient } from '@supabase/supabase-js';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { STAGING_PROJECT_REF, isStagingTestEmail } from '../supabase/functions/staging-quick-login/policy';
import { isLocalQuickLoginRequest } from './stagingQuickLoginPolicy';

interface QuickLoginConfig { url: string; publicKey: string; email?: string; password?: string }
const respond = (response: ServerResponse, status: number, data: unknown) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
};
async function readBody(request: IncomingMessage): Promise<{ email?: unknown }> {
    let body = '';
    for await (const chunk of request) {
        body += chunk;
        if (body.length > 512) throw new Error('Request too large');
    }
    return JSON.parse(body);
}

export function stagingQuickLoginPlugin(config: QuickLoginConfig): Plugin {
    return {
        name: 'local-staging-quick-login', apply: 'serve',
        configureServer(server) {
            if (config.url !== `https://${STAGING_PROJECT_REF}.supabase.co`) return;
            let administrator: ReturnType<typeof createClient> | undefined;
            let pendingAuthentication: Promise<void> | undefined;
            let expiresAt = 0;
            const inFlight = new Set<string>();
            let rosterCache: { accounts: unknown[]; expires: number } | undefined;

            async function callStaging(body: Record<string, unknown>) {
                if (!config.email || !config.password) throw new Error('Private staging login setup is missing');
                const address = server.httpServer?.address();
                if (!address || typeof address === 'string') throw new Error('Local server is unavailable');
                administrator ??= createClient(`http://127.0.0.1:${address.port}/supabase-proxy`, config.publicKey, {
                    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
                });
                if (expiresAt < Date.now() + 30_000) {
                    pendingAuthentication ??= (async () => {
                        const { data, error } = await administrator!.auth.signInWithPassword({ email: config.email!, password: config.password! });
                        if (error || !data.session) throw new Error('Private staging login could not authenticate');
                        expiresAt = (data.session.expires_at || 0) * 1000;
                    })().finally(() => { pendingAuthentication = undefined; });
                    await pendingAuthentication;
                }
                const { data, error } = await administrator.functions.invoke('staging-quick-login', { body });
                if (error || data?.error) throw new Error(data?.error || 'Staging login service is unavailable');
                return data;
            }

            server.middlewares.use('/__staging', async (request, response) => {
                if (!isLocalQuickLoginRequest(request)) return respond(response, 403, { error: 'Local staging access required' });
                try {
                    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
                    if (pathname === '/accounts' && request.method === 'GET') {
                        if (!rosterCache || rosterCache.expires < Date.now()) {
                            const accounts: unknown[] = [];
                            for (let offset = 0; offset < 5000; offset += 100) {
                                const page = await callStaging({ action: 'list', offset });
                                accounts.push(...page.accounts);
                                if (page.accounts.length < 100) break;
                            }
                            rosterCache = { accounts, expires: Date.now() + 30_000 };
                        }
                        return respond(response, 200, { accounts: rosterCache.accounts });
                    }
                    if (pathname !== '/quick-login' || request.method !== 'POST') return respond(response, 404, { error: 'Not found' });
                    if (!request.headers['content-type']?.startsWith('application/json')) return respond(response, 415, { error: 'JSON required' });
                    const { email } = await readBody(request);
                    if (!isStagingTestEmail(email)) return respond(response, 400, { error: 'Choose a staging test employee' });
                    if (inFlight.has(email)) return respond(response, 409, { error: 'Sign-in already in progress' });
                    inFlight.add(email);
                    try {
                        return respond(response, 200, await callStaging({ action: 'login', email }));
                    } finally { inFlight.delete(email); }
                } catch (error) {
                    return respond(response, 503, { error: error instanceof Error ? error.message : 'Staging login is unavailable' });
                }
            });
        }
    };
}
