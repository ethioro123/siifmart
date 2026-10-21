# Local staging Quick Login

Quick Login reads active staging employees from the database, including the `[TEST]` role-coverage accounts. Country, facility and role filters use the live roster; they do not depend on a fixed account list.

Run `npm run dev:staging` and open `http://localhost:3000`. Search by employee code, role, name or site code, then select an employee. The login uses a normal Supabase session and preserves the selected employee's actual role and site.

## Private local setup

The ignored `.env.staging.local` needs these server-only values:

- `SIIFMART_STAGING_ADMIN_EMAIL`: the active staging executive account.
- `SIIFMART_STAGING_ADMIN_PASSWORD`: that account's private password.

Keep both values out of tracked files. Never use a `VITE_` prefix for the password. The local server authenticates the executive privately; the browser receives only the selected test employee's normal session.

Deploy `supabase/functions/staging-quick-login` to project `utykzifrblpyxlvlknsm` with JWT verification enabled. It checks the verified caller's active employee record for CEO authority, accepts only active employees in the staging fixture email domains, and records each developer sign-in. One-time login tokens are generated and consumed inside the function; no email is sent and no password is reset.

## Boundaries and verification

- Both the UI and local middleware require the staging project. The middleware also requires a loopback connection and matching Origin for sign-in.
- The function refuses to run on another project and rejects non-executive callers. No anonymous roster query or login RPC is added.
- The roster uses explicit fields and pages of 100, with a 30-second local cache. It is not included in offline business-data persistence.
- Ordinary credential handover stays pending until completed through the employee workflow. Quick Login is a local development capability.
- Run `PLAYWRIGHT_STAGING_QUICK_LOGIN=1 npx playwright test tests/e2e/staging-quick-login.spec.ts` to verify real DC-picker and retail cashier sign-ins. These tests use fresh browser contexts and do not record session traces.
