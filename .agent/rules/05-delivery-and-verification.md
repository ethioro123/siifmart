# SIIFMART Delivery and Verification Rules

## Key Files Reference

| Purpose | File |
|---------|------|
| All types | `/types.ts` |
| All services | `/services/supabase.service.ts` |
| User state | `/contexts/CentralStore.tsx` |
| App data | `/contexts/DataContext.tsx` |
| Stock mutations | `/hooks/useAdjustStockMutation.ts` |
| Relocations | `/hooks/useRelocateProductMutation.ts` |

---

## Common Tasks

### Adding a New Mutation
1. Create `/hooks/useXxxMutation.ts`
2. Define params interface
3. Call service in `mutationFn`
4. Invalidate queries in `onSuccess`
5. Import and use in component

### Adding a New Page
1. Create `/pages/NewPage.tsx`
2. Add **lazy** route in `/App.tsx`
3. Add sidebar link in `/components/Sidebar.tsx`
4. Add module to `ProtectedRoute` permissions

### Adding a Database Column
1. Create the persistent migration in `/migrations/` before writing or proposing SQL; confirm the live schema first
2. Update interface in `/types/` (or `/types.ts`)
3. Update `mapRow()` in the relevant `.service.ts` (snake_case → camelCase read)
4. Update `update()` allowlist in the same service (camelCase → snake_case write)
5. If needed in `create()`, add to the insert object
6. Apply automatically to the linked project as part of the request; report the application status and migration file name; do not paste SQL into chat unless the user asks to see it

### Adding a New Service
1. **Check if a service already exists** for that domain — extend it instead of creating a duplicate
2. Use kebab-case: `feature-name.service.ts`
3. Place in `/services/`

### Auto-Committing, Versioning & GitHub Pushing
- **Mandatory auto-commit on every turn**: Whenever the AI writes or modifies any code, migration, or configuration and finishes its turn, it **MUST** stage and commit all changes (`git add -A` excluding `.env*` secrets, then `git commit`) automatically without the user touching anything—even if there are remaining issues to fix in a later turn.
- **Lifecycle hook enforcement**: `.agents/hooks.json` registers `scripts/auto-commit-on-stop.sh` on the `Stop` event so any uncommitted work left behind when the AI finishes a turn is automatically staged and committed.
- **Local commit by default**: Always commit locally so work is never lost, and report the resulting commit hash in your final response. Do not run `git push` unless the user explicitly asks to push or release.
- **Release versioning**: Before a release push, follow the project's release/versioning process and verify the displayed application version. Do not change the version for local edits that are not being released.

---

## Testing & Verification

### Automated Tests (Vitest)
- **New services** MUST have unit tests in `/tests/services/`
- **New utils** MUST have unit tests in `/tests/utils/`
- **Bug fixes** MUST include a regression test proving the fix works
- Run the relevant regression tests for the change. Before committing, run the project-required suite and file-size check.

### Manual Verification
- After code changes, run `npx tsc --noEmit` to verify types
- After changing DB-related code, verify queries against Supabase types
- After splitting files, verify all imports resolve correctly
- After modifying routes or navigation, verify pages load without errors

### Test File Conventions
- Test files mirror source structure: `utils/pricing.ts` → `tests/utils/pricing.test.ts`
- Use `describe` blocks per function, `it` blocks per behavior
- Create helper factories (e.g., `makeProduct()`) instead of duplicating test data

---

## Debugging Rules

### Structured Logging
- Use `logger` from `/utils/logger.ts` — **never** raw `console.log` / `console.error`
- Always include module name and action context:

```typescript
import { logger } from '../utils/logger';

// ✅ Correct — searchable, structured
logger.error('POS', 'processPayment', error, { orderId, amount });
logger.warn('Fulfillment', 'No workers available for zone');
logger.info('Inventory', 'Stock adjusted', { productId, delta: -5 });

// ❌ Wrong — unsearchable, no context
console.log('error happened');
console.error(error);
```

### Error Boundaries
- Each major module route MUST be wrapped in `<ModuleErrorBoundary moduleName="X">`
- Module error boundaries are already wired in `App.tsx` for: POS, Fulfillment, Inventory, Financials, Settings
- When adding new page routes, wrap them with `ModuleErrorBoundary`
- The global `GlobalErrorBoundary` in `index.tsx` is the last-resort catch-all

### Troubleshooting
- Refer to `.agent/TROUBLESHOOTING.md` for common issues and where to fix them
- When resolving a new class of bug, add an entry to the troubleshooting guide

---

## State Management Decision Tree

Use the right tool for each type of state:

| State Type | Tool | Example |
|-----------|------|--------|
| Server data (read) | React Query `useQuery` | Products, sales, employees |
| Server data (write) | React Query `useMutation` in `/hooks/` | Stock adjustment, PO creation |
| Cached server data | `useData()` from DataContext | Products list, customers list |
| Auth / session | `useStore()` from CentralStore | Current user, selected site |
| Shared UI state (3+ consumers) | React Context | Theme, language, notifications |
| Local UI state (1-2 components) | `useState` / `useReducer` | Modal open, form values, tab index |
| Form state | React Hook Form + Zod | Product form, employee wizard |
| URL state | React Router `useSearchParams` | Filters, pagination, tab selection |

```typescript
// ❌ Wrong — putting local UI state in context
const [isModalOpen, setIsModalOpen] = useStore(); // Don't pollute global state

// ✅ Correct — local state stays local
const [isModalOpen, setIsModalOpen] = useState(false);
```

---

## File Organization Rules

### When to Split
| Signal | Action |
|---------|--------|
| A source file exceeds 500 lines or is difficult to reason about | Split by responsibility before changing behavior |
| Component has independent tabs, modal, or form sections | Extract when it improves readability or reuse |
| Logic is shared across multiple call sites | Move to an appropriate hook, service, or pure utility |
| A type/helper is private to one feature | Keep it near that feature unless reuse emerges |

### Directory Patterns
```
# Large component with sub-components
components/fulfillment/
  FulfillmentContent.tsx        ← Main orchestrator
  PickTab.tsx                   ← Tab component
  PackTab.tsx                   ← Tab component
  pick/                         ← Complex tab sub-components
    PickScanner.tsx
    PickJobModal.tsx
    PickHistory.tsx

# Context with extracted hooks
contexts/
  DataContext.tsx                ← Provider + raw state
  hooks/
    useProductActions.ts         ← Product mutations
    useSaleActions.ts            ← Sale mutations
```

---

## 500-Line File Limit

**No source file may exceed 500 lines.** Keep guidance files focused and below 500 lines as well.

When editing or creating any file, the AI MUST:

1. **Check the line count** of the file before and after changes.
2. **If a file is already over 500 lines**, split it before changing behavior; avoid unrelated refactors.
3. **If your changes would push a file over 500 lines**, split code into new files proactively — never leave a file above 500 lines.

### How to Split

| What to extract | Where to put it |
|-----------------|-----------------|
| Sub-components (sections, modals, tabs, cards) | Same directory as the parent, e.g. `ComponentName/SubPart.tsx` |
| Shared logic / helpers | `/utils/featureName.utils.ts` |
| Custom hooks | `/hooks/useFeatureName.ts` |
| Type definitions | `/types/featureName.types.ts` or keep in `/types.ts` if small |
| Constants, config maps | `/constants/featureName.constants.ts` |
| Context logic | Split provider vs. hook: `FeatureContext.tsx` + `useFeature.ts` |

### Splitting Rules

- **Barrel exports**: When splitting a component into a folder, create an `index.ts` that re-exports the main component so imports don't break.
- **Shared state**: Use React Context or prop-drilling — never duplicate state across split files.
- **Preserve behavior**: Splitting must not reduce functionality or break imports. Verify imports and run relevant checks after splitting.
- **Naming**: Split files should have clear, descriptive names reflecting their content (e.g., `OrderSummaryCard.tsx`, `useOrderFilters.ts`).

---

## Non-negotiable safeguards

- Never trust browser-supplied identity, role, country, site, price, total, approval, or ownership. Enforce these at a trusted boundary.
- Never expose privileged keys, credentials, PINs, or sensitive personal data in client bundles, tracked files, or logs.
- Never skip RLS/grant review, role checks, country/site scoping, required approvals, blind-count controls, or chain-of-custody records.
- Never write business data or sensitive session state to `localStorage` when it belongs in the server or secure session store.
- Never mutate from a component by calling a service directly. Never use mass-assignment spreads in database updates or silently swallow errors.
- Never create a migration after writing its SQL. Save the migration to disk first, state whether it was applied, and do not paste SQL into chat unless the user asks to see it.
- Never hardcode country-specific prices, tax, tender, or operational policy across tenants. Do not add settings for fixed technical details that operators do not need to control.
- Never fan out every business mutation to unrelated modules. Define real dependencies and make retries idempotent and observable.
- Never use unvalidated HTML, raw console logging, `any`, inline aesthetic values, or interface emoji.
- Never rely on client route guards as authorization, on color alone to communicate status, or on geolocation/device metadata as proof of identity.
- Never put liquor or other prohibited alcohol products/categories in the catalog, mocks, or examples.
- Preserve approved delivery-role restrictions, dual handover, authenticated supervisory reason capture, and the no-cross-border financial/stock rules in the operations guide.
- Never push a release without following the current versioning and release process.
