// @ts-nocheck -- Checked by the Supabase Deno deployment runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { STAGING_PROJECT_REF, isStagingExecutive, isStagingTestEmail } from './policy.ts';

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

Deno.serve(async (request: Request) => {
    const url = Deno.env.get('SUPABASE_URL') || '';
    if (url !== `https://${STAGING_PROJECT_REF}.supabase.co`) return reply(404, { error: 'Not available' });
    if (request.method !== 'POST') return reply(405, { error: 'POST required' });
    const authorization = request.headers.get('Authorization');
    if (!authorization) return reply(401, { error: 'Authentication required' });

    try {
        const publicKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const callerClient = createClient(url, publicKey, {
            ...options, global: { headers: { Authorization: authorization } }
        });
        const { data: { user }, error: userError } = await callerClient.auth.getUser();
        if (userError || !user) return reply(401, { error: 'Authentication required' });
        const { data: caller, error: callerError } = await callerClient.from('employees')
            .select('role,status').eq('id', user.id).maybeSingle();
        if (callerError || caller?.status !== 'Active' || !isStagingExecutive(caller?.role)) {
            return reply(403, { error: 'Staging executive access required' });
        }
        const body = await request.json();
        const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, options);
        if (body.action === 'list') {
            const offset = Number(body.offset || 0);
            if (!Number.isInteger(offset) || offset < 0 || offset > 5000) return reply(400, { error: 'Invalid page' });
            const { data, error } = await admin.from('employees')
                .select('id,name,role,job_title,code,email,site:sites!employees_site_id_fkey(code,name,type,country,region_code)')
                .eq('status', 'Active')
                .or('email.like.%@staging.siifmart.com,email.like.%@role-coverage.staging.siifmart.invalid')
                .order('id').range(offset, offset + 99);
            if (error) return reply(503, { error: 'Unable to load staging employees' });
            return reply(200, { accounts: data });
        }
        if (body.action !== 'login' || !isStagingTestEmail(body.email)) {
            return reply(400, { error: 'Choose an active staging test employee' });
        }
        const { data: employee, error: employeeError } = await admin.from('employees')
            .select('id,email,site_id').eq('email', body.email.toLowerCase()).eq('status', 'Active').maybeSingle();
        if (employeeError || !employee) return reply(404, { error: 'Active staging test employee not found' });

        // Generate and consume the one-time token server-side; no email or password is sent to the browser.
        const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: employee.email });
        if (linkError || !link?.properties?.hashed_token) return reply(503, { error: 'Unable to prepare staging sign-in' });
        const signInClient = createClient(url, publicKey, options);
        const { data: signedIn, error: signInError } = await signInClient.auth.verifyOtp({
            token_hash: link.properties.hashed_token, type: 'magiclink'
        });
        if (signInError || !signedIn.session || signedIn.user?.id !== employee.id) {
            return reply(503, { error: 'Unable to authenticate staging employee' });
        }
        const { error: auditError } = await admin.from('system_logs').insert({
            action: 'STAGING_QUICK_LOGIN', module: 'Security', performed_by: user.id,
            details: JSON.stringify({ employeeId: employee.id, siteId: employee.site_id })
        });
        if (auditError) return reply(503, { error: 'Unable to record staging sign-in' });
        return reply(200, { session: {
            access_token: signedIn.session.access_token, refresh_token: signedIn.session.refresh_token
        } });
    } catch {
        return reply(503, { error: 'Staging sign-in is temporarily unavailable' });
    }
});
