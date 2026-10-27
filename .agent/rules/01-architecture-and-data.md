# SIIFMART Architecture and Data Flow

> These rules guide AI assistants in developing SIIFMART consistently and correctly.

## Architecture Overview

```
/pages/          → Full-page components (routes) — always lazy-loaded
/components/     → Reusable UI components
/contexts/       → React contexts (CentralStore, DataContext, LanguageContext)
/hooks/          → Custom React hooks (mutations, queries)
/services/       → Supabase API layer (*.service.ts)
/types.ts        → All TypeScript interfaces and types
/utils/          → Pure helper functions (NO hooks here)
/schemas/        → Zod validation schemas
/migrations/     → SQL schema migrations
/tests/          → Unit tests (Vitest) and e2e tests (Playwright)
/scratch/        → Temporary debug/test scripts (NOT production code)
/scripts/        → Build/CI scripts (check-file-size.sh, etc.)
```

---

## Core Patterns

### Data Mutations
- **All data modifications MUST use React Query mutation hooks** in `/hooks/`
- Never call service functions directly from components for writes
- Mutation hooks update or invalidate only the affected query keys

```typescript
// ✅ Correct
const mutation = useAdjustStockMutation();
await mutation.mutateAsync({ productId, quantity, direction: 'IN', ... });

// ❌ Wrong - Direct service call
await productsService.update(id, { stock: newStock });
```

### Data Reading
- Use `useData()` from DataContext for cached data (products, customers, etc.)
- Use `useStore()` from CentralStore for user/session state
- Use React Query `useQuery` for fresh server data

### Site Filtering
- Most data is site-scoped via `siteId`
- HQ/CEO aggregation requires an explicit authorized scope enforced at the server/database boundary
- Client filtering may improve the interface but cannot replace server-side scope enforcement

### Configuration
- Check whether a business rule genuinely varies by country/site or must be controlled by an authorized operator. Make only those rules configurable.
- Give each setting an owner, safe default, validated range, country/site scope where applicable, and an audit trail for sensitive changes.
- Keep fixed technical constants in code; avoid turning implementation details into user-facing settings.

### Country-Separated Configuration
- Country-dependent settings and data must be explicitly scoped to `country_code` in storage, reads, writes, background jobs, and cache keys.
- Shared technical defaults may be global only when they contain no country-specific policy or data; document that scope clearly.

### Database Migrations, Persistent Files & SQL Execution Status
- **Every database change MUST FIRST have a persistent migration file** in `/migrations/` named `YYYYMMDD_description.sql`. Creating this permanent, version-controlled file on disk is paramount and takes precedence over in-chat snippets. Never write, propose, or generate SQL without first creating the migration file on disk.
- When the Supabase CLI is available, use its migration-creation command (check the installed CLI help first) and retain the repository's required migration naming convention.
- **SQL delivery and execution**: For each requested database change, first save its complete SQL in a persistent `/migrations/YYYYMMDD_description.sql` file, inspect the linked Supabase project's live schema and migration history, then apply the migration to that linked project automatically as part of the request. Do not ask for separate SQL-application authorization. If there is no linked project or the execution tool blocks application, keep the migration file and report the specific blocker. In the final response, identify the saved migration file(s), state whether each was applied and to which project/environment, and report any blocker. Do not paste SQL into chat unless the user asks to see it.

### Cross-Module Events
- Propagate a change only to systems that depend on that business event; do not fan out unrelated work.
- Use explicit event contracts, stable correlation IDs, idempotent handlers, and retry/dead-letter behavior where supported. Keep each cascade inside its country boundary.
- Update affected query caches precisely. Do not use broad invalidation as a substitute for a defined event flow.

### Efficient Data Access
- Fetch the active working set at module entry; load history and large detail payloads when requested.
- Select only fields needed by the screen. Load line items and nested data for detail views, not summary lists.
- Use keyset or server pagination for growing datasets. A modest initial page (often 25 records) is a starting default, not a universal maximum; tune it to device, row size, and measured latency.
- Scope every query by authorized country and site. Broader aggregation requires an explicit privileged role and server-side enforcement.
- Use targeted query invalidation and cache lifetimes based on data volatility. Prefer realtime events or explicit refresh for live data; avoid blind polling loops.

### Accurate, Focused Work
- Inspect the relevant implementation and a matching pattern; read larger files in focused sections when practical.
- Verify database fields against the schema registry, generated types, or live schema before writing queries.
- Diagnose from evidence before changing code; avoid blind patch/retry cycles.
- Summarize outcomes and verification in plain language. Provide detailed audit findings only when requested or needed for a material multi-area change.

---

