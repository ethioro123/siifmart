# SIIFMART AI Agent Rules

> All AI assistants working on this project MUST follow the rules in `.agent/RULES.md`.

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
- **Field Mapping**: Service `update()` methods MUST use explicit allowlists — never `{ ...object }` to Supabase
- **Design Tokens**: Use sand/emerald/amber palette (`#2C5E3B`, `#EAE5D9`, `amber-600`) — not old `cyber-*` tokens
- **Mobile-First (POS/WMS)**: No `backdrop-blur` on scrollable elements, no `transition-all`, only animate `transform`/`opacity`, min 44px touch targets

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
- ❌ Don't spread full objects into Supabase — use explicit column allowlists
- ❌ Don't add a TS field without updating the service mapper + allowlist
- ❌ Don't use old `cyber-*` design tokens — use sand/emerald/amber palette

## References
- Full rules: `.agent/RULES.md`
- Troubleshooting: `.agent/TROUBLESHOOTING.md`
- Feature registry: `.agent/FEATURE_REGISTRY.md`
