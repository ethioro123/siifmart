# SIIFMART AI Development Rules

> All AI assistants working on this project MUST follow these rules. Full details in `.agent/RULES.md`.

## Before ANY Code Change
1. Run `git status` — warn if there are uncommitted changes
2. Check if the file you're editing exceeds 500 lines — if so, **split it first**
3. Verify changes compile: `npx tsc --noEmit`

## Critical Patterns
- **Mutations**: Always use hooks in `/hooks/` — never call services directly from components
- **Data Reading**: `useData()` for cached data, `useStore()` for session state, `useQuery` for fresh server data
- **Site Scoping**: Always filter by `siteId` — never show cross-site data to non-HQ users
- **Error Handling**: Services throw errors, hooks catch with `onError` + toast — never swallow errors
- **Logging**: Use `logger` from `/utils/logger.ts` — never raw `console.log` / `console.error`
- **Error Boundaries**: New page routes MUST be wrapped in `<ModuleErrorBoundary moduleName="X">`
- **Config-Gating**: Whenever creating or auditing logic, check if it needs a setting to control it — never hardcode operational policies
- **Country-Isolated Settings**: Every setting must be 100% separated per country; settings in one country must never apply to another
- **Invisible Tenancy & Single Global Switch**: Country switching is done exclusively by the CEO via ONE central toggle in the top navigation. Settings pages must NEVER contain per-screen country selectors. Non-CEO users see a seamless, native national platform with zero awareness of multi-tenancy. All separation is enforced automatically in the background.
- **Mandatory In-Chat SQL Delivery**: Whenever ANY SQL migration, table, column, index, RPC function, or RLS policy is created or modified while coding, ALWAYS output the complete, runnable, copy-pasteable SQL snippet directly in the chat response so the user can easily copy and execute it in Supabase SQL Editor. Never silently create or alter migrations without bringing the full runnable SQL to the chat.

## File Size Limit (ENFORCED)
No file may exceed **500 lines**. Before editing a large file, split it using these patterns:
- Modals → separate component files
- Tab content → separate component files
- Forms > 100 lines → extracted components
- Shared logic → hooks or utils

## Architecture
```
/pages/          → Full-page route components (lazy-loaded)
/components/     → Reusable UI components
/contexts/       → React contexts (CentralStore, DataContext, LanguageContext)
/hooks/          → Custom React hooks (mutations, queries)
/services/       → Supabase API layer (*.service.ts)
/types.ts        → TypeScript interfaces & types
/utils/          → Pure helper functions (NO hooks)
/schemas/        → Zod validation schemas
/migrations/     → SQL schema migrations
/tests/          → Unit tests (Vitest) and e2e tests (Playwright)
/scratch/        → Temporary debug/test scripts (NOT production code)
```

## State Management
| State Type | Tool |
|-----------|------|
| Server data (read) | React Query `useQuery` |
| Server data (write) | `useMutation` hook in `/hooks/` |
| Cached data | `useData()` from DataContext |
| Auth / session | `useStore()` from CentralStore |
| Shared UI (3+ consumers) | React Context |
| Local UI (1-2 components) | `useState` / `useReducer` |
| Form state | React Hook Form + Zod |

## Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase `.tsx` | `ProductForm.tsx` |
| Services | kebab-case `.service.ts` | `purchase-orders.service.ts` |
| Hooks | `use` prefix, camelCase, in `/hooks/` only | `useAdjustStockMutation.ts` |
| Utils | camelCase, in `/utils/` only | `formatting.ts`, `pricing.ts` |
| Types | PascalCase interfaces/types | `Product`, `SalesOrder` |
| Migrations | `YYYYMMDD_description.sql` | `20260407_security_hardening.sql` |

## Testing Requirements
- New services → unit tests in `/tests/services/`
- New utils → unit tests in `/tests/utils/`
- Bug fixes → regression test proving the fix
- Run before commit: `npx vitest run` and `npm run lint:size`

## Don'ts
- ❌ Don't let any file exceed 500 lines
- ❌ Don't call services directly for mutations (use hooks)
- ❌ Don't skip role checks
- ❌ Don't hardcode site IDs
- ❌ Don't use `any` type
- ❌ Don't use raw console.log — use `logger` from `/utils/logger.ts`
- ❌ Don't put hooks in /utils/
- ❌ Don't add DB columns without a migration file
- ❌ Don't silently swallow errors
- ❌ Don't add new page routes without `ModuleErrorBoundary`
- ❌ Don't skip writing tests for new services/utils
- ❌ Don't eagerly import pages — use `React.lazy()` in App.tsx
- ❌ Don't push without incrementing version in LoginPage.tsx
- ❌ Don't hardcode operational business logic, thresholds, or workflow behaviors without a configurable setting to control them
- ❌ Don't allow any setting to apply across multiple countries — every single setting must be 100% separated per country
- ❌ Don't mutate or fetch system settings without passing the active country scope (`country_code`)
- ❌ Don't add country selectors or partition switchers inside individual settings pages (country switching belongs ONLY in the central CEO global switch)
- ❌ Don't expose tenancy mechanics to non-CEO users (the app must render as a seamless native national platform)
- ❌ Don't require users to manually target a country when configuring settings — bind and isolate per active country automatically
- ❌ Don't create or modify SQL migrations without bringing the complete, runnable SQL to the chat for the user to run in Supabase

## References
- Full rules: `.agent/RULES.md`
- Troubleshooting: `.agent/TROUBLESHOOTING.md`
- Feature registry: `.agent/FEATURE_REGISTRY.md`
