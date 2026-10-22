# Using the staging project

The separate `SIIFMART Staging` Supabase project is on the Free plan in the same region as production. It has its own Auth users and database. No production records were copied.

## Current status

The app's staging environment is connected locally. `npm run dev:staging` serves staging at `http://localhost:3000` with a visible warning. `npm run dev` serves production at `http://localhost:3001`. Both servers require their assigned port, so a port conflict fails at startup instead of silently moving either app. Production has more applied migrations than the repository contains. Before a database change, inspect the target project's live schema and migration history, save the complete SQL in `/migrations/YYYYMMDD_description.sql`, then automatically apply it to the repository-linked project (or staging when the task targets staging). Do not bulk-copy production records; staging test accounts and data must be synthetic.

## After the schema has been installed

1. Add only synthetic test records and test accounts in staging.
2. Start the app with `npm run dev:staging` and verify the amber `Staging environment · Test data only` warning is visible.
3. Test employee creation, approval, site assignment, account creation, and credential handover there.
4. Create real employees in production through the app's normal employee workflow.

The local credentials live in the ignored `.env.staging.local` file. Never use a service-role key in the app. Supabase Free projects may pause after a week of inactivity and are subject to Free plan quotas.
