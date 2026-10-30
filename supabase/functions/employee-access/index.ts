// @ts-nocheck — Deployed with the Supabase Deno runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { canManageEmployeeAccess, hasEmployeeAccessScope, newEmployeePassword } from './policy.ts';
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Cache-Control': 'no-store'
};
const response = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers });
    if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
    try {
        const authorization = request.headers.get('Authorization');
        if (!authorization) return response({ error: 'Authentication required' }, 401);
        const url = Deno.env.get('SUPABASE_URL')!;
        const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
        const { data: identity, error: authError } = await caller.auth.getUser();
        if (authError || !identity.user) return response({ error: 'Authentication required' }, 401);
        const body = await request.json();
        if (!body || !['prepare', 'complete'].includes(body.action) ||
            typeof body.employeeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.employeeId) ||
            typeof body.countryCode !== 'string' || !/^[A-Z]{2}$/.test(body.countryCode) ||
            Object.keys(body).some(key => !['action', 'employeeId', 'countryCode'].includes(key))) return response({ error: 'Invalid access request' }, 400);
        const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
        const projection = 'id,name,role,status,site_id,email,badges,credentials_handed_over_at';
        const [actorResult, targetResult] = await Promise.all([
            admin.from('employees').select(projection).eq('id', identity.user.id).single(),
            admin.from('employees').select(projection).eq('id', body.employeeId).single()
        ]);
        const actor = actorResult.data, target = targetResult.data;
        if (actorResult.error || targetResult.error || !actor || !target || !canManageEmployeeAccess(actor, target)) return response({ error: 'Access denied' }, 403);
        const [actorSite, targetSite, scope] = await Promise.all([
            admin.from('sites').select('id,country').eq('id', actor.site_id).single(),
            admin.from('sites').select('id,country').eq('id', target.site_id).single(),
            caller.rpc('is_site_in_my_authorized_scope', { p_site_id: target.site_id, p_country_code: body.countryCode })
        ]);
        if (scope.error || targetSite.error || !hasEmployeeAccessScope(actor.role, body.countryCode, actorSite.data?.country, targetSite.data?.country, scope.data)) return response({ error: 'Access denied' }, 403);
        const readiness = await admin.rpc('employee_access_ready');
        if (readiness.error || readiness.data !== 1) return response({ error: 'Employee access setup is not available yet' }, 503);
        const existing = await admin.auth.admin.getUserById(target.id);
        if (existing.error && existing.error.status !== 404) return response({ error: 'Could not verify login account' }, 503);
        if (existing.data?.user && existing.data.user.email?.toLowerCase() !== target.email.toLowerCase()) return response({ error: 'Employee and login identity do not match. Contact authorized support.' }, 409);
        if (body.action === 'complete') {
            if (!existing.data?.user) return response({ error: 'Prepare and verify login access before handover' }, 409);
            const { data, error } = await admin.rpc('record_employee_access_handover', { p_actor_id: actor.id, p_employee_id: target.id, p_country_code: body.countryCode, p_actor_role: actor.role, p_employee_role: target.role, p_site_id: target.site_id });
            if (error || !data?.handedOverAt) return response({ error: 'Handover was not confirmed' }, 409);
            return response({ employeeId: target.id, handedOverAt: data.handedOverAt });
        }
        if (existing.data?.user) return response({ employeeId: target.id, email: target.email, accountStatus: 'existing' });
        const password = newEmployeePassword();
        const created = await admin.auth.admin.createUser({
            id: target.id, email: target.email, password, email_confirm: true,
            user_metadata: { name: target.name },
            app_metadata: { staff_employee_id: target.id, role: target.role, site_id: target.site_id, country_code: body.countryCode }
        });
        if (created.error || created.data?.user?.id !== target.id) return response({ error: 'Login account was not created. Verify the employee identity before retrying.' }, 409);
        const { error: auditError } = await admin.from('system_logs').insert({
            action: 'EMPLOYEE_LOGIN_PROVISIONED', module: 'HR', site_id: target.site_id,
            country_code: body.countryCode, employee_id: actor.id, user_name: actor.name,
            details: JSON.stringify({ employeeId: target.id, accountStatus: 'created' })
        });
        if (auditError) return response({ error: 'Account created, but access audit was not confirmed. Use the authorized recovery process.' }, 503);
        return response({ employeeId: target.id, email: target.email, accountStatus: 'created', temporaryPassword: password });
    } catch {
        return response({ error: 'Employee access request could not be completed' }, 500);
    }
});
