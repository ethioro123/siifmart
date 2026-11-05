import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
import { canResetEmployeePassword } from '../../supabase/functions/admin-reset-password/policy';
const actorId = '11111111-1111-4111-8111-111111111111', targetId = '22222222-2222-4222-8222-222222222222';
async function execute(role: string, scope = true, status = 'Active') {
 const source = readFileSync(new URL('../../supabase/functions/admin-reset-password/index.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '');
 let handler: ((request: Request) => Promise<Response>) | undefined;
 const update = vi.fn().mockResolvedValue({ error: null });
 const caller = { auth: { getUser: async () => ({ data: { user: { id: actorId } }, error: null }) }, rpc: async () => ({ data: scope, error: null }) };
 const admin = { auth: { admin: { updateUserById: update } }, from: (table: string) => table === 'system_logs' ? { insert: async () => ({ error: null }) } : { select: () => ({ eq: (_key: string, id: string) => ({ single: async () => ({ data: { id, role: id === actorId ? role : 'driver', status: id === actorId ? status : 'Active', site_id: 'site' }, error: null }), maybeSingle: async () => ({ data: { country: 'ET' }, error: null }) }) }) } };
 const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
 runInNewContext(code, { Request, Response, canResetEmployeePassword, Deno: { env: { get: (name: string) => name }, serve: (fn: typeof handler) => { handler = fn; } }, createClient: (_url: string, key: string) => key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : caller });
 const response = await handler!(new Request('https://example.invalid/reset', { method: 'POST', headers: { Authorization: 'Bearer inert-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: targetId, newPassword: 'Inert-test-value-123!' }) }));
 return { response, update };
}
it('denies administrative password reset to floor receivers', async () => { const { response, update } = await execute('receiver'); expect(response.status).toBe(403); expect(update).not.toHaveBeenCalled(); });
it('denies inactive administrators', async () => { const { response, update } = await execute('warehouse_manager', true, 'Terminated'); expect(response.status).toBe(403); expect(update).not.toHaveBeenCalled(); });
it('denies an out-of-scope target', async () => { const { response, update } = await execute('warehouse_manager', false); expect(response.status).toBe(403); expect(update).not.toHaveBeenCalled(); });
it('allows an authorized scoped administrator without changing a real account', async () => { const { response, update } = await execute('warehouse_manager'); expect(await response.json()).toEqual({ success: true }); expect(update).toHaveBeenCalledTimes(1); });
