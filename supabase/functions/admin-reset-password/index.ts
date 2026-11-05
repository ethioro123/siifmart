// @ts-nocheck — Supabase Deno runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { canResetEmployeePassword } from './policy.ts';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const respond = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers });
    if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization) return respond({ error: 'Authentication required' }, 401);
        const url = Deno.env.get('SUPABASE_URL')!;
        const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
        const { data: identity, error: authError } = await caller.auth.getUser();
        if (authError || !identity.user) return respond({ error: 'Authentication required' }, 401);
        const body = await request.json();
        if (!body || typeof body.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.userId) || typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128 || Object.keys(body).some(k => !['userId', 'newPassword'].includes(k))) return respond({ error: 'Employee ID and password of 12 to 128 characters required' }, 400);
        const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
        const columns = 'id,role,status,site_id';
        const [actorResult, targetResult] = await Promise.all([
            admin.from('employees').select(columns).eq('id', identity.user.id).single(),
            admin.from('employees').select(columns).eq('id', body.userId).single()
        ]);
        const actor = actorResult.data, target = targetResult.data;
        if (actorResult.error || targetResult.error || !canResetEmployeePassword(actor, target)) return respond({ error: 'Password administration authority required' }, 403);
        const { data: site } = await admin.from('sites').select('country').eq('id', target.site_id).maybeSingle();
        const { data: scoped, error: scopeError } = await caller.rpc('is_site_in_my_authorized_scope', { p_site_id: target.site_id, p_country_code: site?.country });
        if (scopeError || (actor.role !== 'group_ceo' && (!site?.country || scoped !== true))) return respond({ error: 'Target outside password administration scope' }, 403);
        const { error } = await admin.auth.admin.updateUserById(target.id, { password: body.newPassword });
        if (error) return respond({ error: 'Password reset was not confirmed' }, 409);
        const { error: auditError } = await admin.from('system_logs').insert({ action: 'ADMIN_PASSWORD_RESET', module: 'HR', employee_id: actor.id, site_id: target.site_id, country_code: site?.country, entity_type: 'employee', entity_id: target.id, details: 'Authenticated administrator reset employee password' });
        if (auditError) return respond({ error: 'Password reset completed, but audit recording was not confirmed. Contact authorized support.' }, 503);
        return respond({ success: true });
    } catch { return respond({ error: 'Password reset could not be completed' }, 500); }
});
