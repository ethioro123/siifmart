# SIIFMART AI Development Rules

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
- Mutations auto-invalidate related queries

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
- HQ/CEO views use `siteId === null` or aggregate across sites
- Always check `products.filter(p => p.siteId === currentSiteId)`

---

## Role Hierarchy

| Level | Roles | Access |
|-------|-------|--------|
| L1 | `super_admin`, `CEO` | Full system access |
| L2 | `regional_manager`, `operations_manager`, `procurement_manager`, `hr_manager`, `finance_manager` | Department/region-wide |
| L3 | `store_manager`, `warehouse_manager`, `assistant_manager` | Site-scoped |
| L4 | `cashier`, `picker`, `driver`, etc. | Task-specific |

### Approval Pattern
```typescript
const canApprove = ['super_admin', 'CEO'].includes(user?.role || '');
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase `.tsx` | `ProductForm.tsx` |
| Services | kebab-case `.service.ts` | `purchase-orders.service.ts` |
| Hooks | `use` prefix, camelCase, in `/hooks/` only | `useAdjustStockMutation.ts` |
| Utils | camelCase, in `/utils/` only | `formatting.ts`, `pricing.ts` |
| Types | PascalCase interfaces/types | `Product`, `SalesOrder` |
| Migrations | `YYYYMMDD_description.sql` | `20260407_security_hardening.sql` |

---

## Import Order

Imports in every file should follow this order, separated by blank lines:

```typescript
// 1. React & third-party libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Contexts & hooks
import { useStore } from '../contexts/CentralStore';
import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';

// 3. Services
import { productsService } from '../services/products.service';

// 4. Components
import { ConfirmationModal } from './ConfirmationModal';

// 5. Utils & helpers
import { formatCurrency } from '../utils/formatting';

// 6. Types
import type { Product } from '../types';

// 7. Constants & assets
import { ROLES } from '../constants';
```

---

## Styling Rules

### Tailwind CSS v4
- Theme defined in `index.css` using `@theme { }` block
- Use utility classes, avoid inline styles
- Dynamic values use CSS variables via `ref` callbacks

```tsx
// ✅ Correct - CSS variable for dynamic width
<div 
  ref={el => el?.style.setProperty('--progress', `${percentage}%`)}
  className="w-dynamic"
/>

// ❌ Wrong - Inline style
<div style={{ width: `${percentage}%` }} />
```

### Design Tokens (Sand / Emerald / Amber)
- Primary Green: `#2C5E3B` (dark), `#A9CBA2` (light accent)
- Sand/Warm: `#EAE5D9` (light bg), `#1E3F27` (dark text), `#E2DCCE` (light border)
- Accent Amber: `amber-600` (light mode), `amber-500` (dark mode)
- Dark Mode BG: `#18201B`, borders: `emerald-950/20`
- Glassmorphism: `backdrop-blur-xl` with semi-transparent backgrounds
- Light cards: `bg-white/85`, Dark cards: `bg-[#18201B]/65`

---

## Error Handling

- Services should **throw errors**, not silently return `null` or `undefined`
- Mutation hooks handle errors via `onError` callback with toast notifications
- **Never** swallow errors with empty `catch` blocks
- Use `logger.error()` / `logger.warn()` from `/utils/logger.ts` — never raw `console.log`

```typescript
import { logger } from '../utils/logger';

// ✅ Correct — structured logging with module context
try {
  const result = await productsService.update(id, data);
  return result;
} catch (error) {
  logger.error('Products', 'update', error, { productId: id });
  throw error; // Re-throw so the mutation's onError fires
}

// ❌ Wrong - Silent swallow
try {
  await productsService.update(id, data);
} catch (e) {
  // empty
}
```

---

## Component Patterns

- **Modals** should be separate components, never inline JSX blobs
- **Tab content** should be separate components (e.g., `PickTab.tsx`, `PackTab.tsx`)
- **Forms** over 100 lines should be extracted into their own component
- **Shared UI elements** (buttons, badges, cards) go in `/components/shared/`
- **Pages** must be lazy-loaded in `App.tsx` using `React.lazy()` — never eagerly imported

```tsx
// ✅ Correct - Lazy loaded page
const Inventory = lazy(() => import('./pages/Inventory'));

// ❌ Wrong - Eager import of a page
import Inventory from './pages/Inventory';
```

---

## Database Rules

- **Never** modify the database schema without a migration file in `/migrations/`
- Migration filenames must follow: `YYYYMMDD_description.sql`
- Always update RLS policies when adding new tables
- Always add new columns as **nullable** or with **defaults** — never break existing rows
- After changing DB-related code, verify queries against Supabase types

### DB Schema Registry

Migration files can drift from the live database (e.g., someone changed a column in the Supabase Dashboard). To prevent column-mismatch bugs:

- Maintain a **schema registry** at `/schemas/db-schema.md` documenting every table's actual live columns, types, and constraints.
- When fixing a Supabase error, **always probe the live schema first** — never assume migration files are accurate.
- After any direct DB change in Supabase Dashboard, update BOTH the registry AND create a migration file.
- Never trust code comments about column names — verify against the registry or query the live DB.

### RLS-Aware Query Patterns

Row Level Security policies apply separately to INSERT, SELECT, UPDATE, and DELETE. Chaining operations triggers multiple policies:

```typescript
// ❌ DANGEROUS — triggers BOTH INSERT and SELECT RLS policies
// If the user can insert but not select, this returns 403
const { data, error } = await supabase
    .from('system_logs')
    .insert(dbLog)
    .select('*');

// ✅ Correct — insert-only, no SELECT policy triggered
const { error } = await supabase
    .from('system_logs')
    .insert(dbLog);

// ✅ Correct — if you need returned data, use minimal columns
const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select('id, created_at');
```

- **Never chain `.select('*')` after `.insert()`** unless you've verified the user has SELECT permissions.
- Append-only tables (like `system_logs`) typically have INSERT-only policies.
- When you don't need the returned row, omit `.select()` entirely.


---

## Service Field Mapping (CRITICAL)

Supabase uses **snake_case** columns. TypeScript uses **camelCase** fields. Every service's `update()` method MUST use an **explicit allowlist** of DB columns — **never** spread the full TypeScript object.

```typescript
// ✅ Correct — allowlist approach (only known DB columns sent)
const dbUpdates: Record<string, unknown> = {};
const directFields: (keyof Site)[] = ['name', 'type', 'address', 'status'];
for (const field of directFields) {
    if (updates[field] !== undefined) dbUpdates[field] = updates[field];
}
const fieldMap: [keyof Site, string][] = [
    ['terminalCount', 'terminal_count'],
    ['bonusEnabled', 'bonus_enabled'],
];
for (const [tsKey, dbKey] of fieldMap) {
    if (updates[tsKey] !== undefined) dbUpdates[dbKey] = updates[tsKey];
}

// ❌ DANGEROUS — unknown fields cause Supabase 400 Bad Request
const dbUpdates = { ...updates };
delete dbUpdates.id; // Denylist approach misses new fields!
```

### When Adding a New Column
1. Create migration in `/migrations/` → run in Supabase
2. Add field to interface in `/types/`
3. Add to the `mapSiteRow()` or equivalent mapper (snake → camel)
4. Add to the `update()` allowlist (camel → snake)
5. If needed in `create()`, add to the insert object

---

## Performance

- All page components in `/pages/` MUST be lazy-loaded via `React.lazy()` in `App.tsx`
- Never eagerly import page-level components
- Use `React.memo` for expensive pure components that receive stable props
- Avoid unnecessary re-renders by memoizing callbacks/values passed as props
- Lists over 50 items MUST use virtualization (`react-window` or similar)
- Expensive computations MUST use `useMemo` with correct dependency arrays
- Event handlers passed as props MUST use `useCallback` to prevent child re-renders
- Images MUST use lazy loading (`loading="lazy"`) unless above the fold
- Avoid creating new objects/arrays in render — extract to `useMemo` or constants

```typescript
// ✅ Correct — memoized for stable reference
const filteredProducts = useMemo(
  () => products.filter(p => p.category === selectedCategory),
  [products, selectedCategory]
);

// ❌ Wrong — creates new array every render
const filteredProducts = products.filter(p => p.category === selectedCategory);
```

---

## Mobile-First: POS & WMS Modules (CRITICAL)

POS and Fulfillment/WMS are deployed on **mobile phones and tablets** in stores and warehouses. All code touching these modules MUST be optimized for low-powered mobile browsers.

### Animation & CSS Rules
- **Only animate `transform` and `opacity`** — GPU-accelerated, won't cause jank
- **Never animate** `width`, `height`, `margin`, `padding`, `box-shadow`, `border-radius`
- **No `backdrop-blur`** on scrollable lists or re-rendered elements — use solid `bg-` colors
- **No `transition-all`** — specify exact properties: `transition: transform 200ms, opacity 150ms`
- **Max duration**: `200ms` interactive feedback, `300ms` page transitions
- **No JS animation libraries** (Framer Motion, GSAP) in POS/WMS bundles

### Touch & Interaction
- **Touch targets**: Min **44×44px** for all buttons, toggles, interactive elements
- **No hover-only actions**: `:hover` content MUST also be accessible via tap/long-press
- **Debounce search** by ≥300ms — mobile keyboards fire rapid events
- **Avoid dropdowns** in scanning flows — use large tappable cards/buttons

### Performance Budget
- **Virtualize** lists >30 items (`react-window` or `react-virtuoso`)
- **Lazy-load all modals** — never eagerly import modal components in POS/WMS
- **No heavy chart libraries** — defer visualization to Settings/HQ pages
- **Defer non-critical work** with `requestAnimationFrame` or `setTimeout(fn, 0)`
- **Test aesthetic changes on Slow 3G** (Chrome DevTools → Network) before merging

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
1. Create migration in `/migrations/` and run SQL in Supabase
2. Update interface in `/types/` (or `/types.ts`)
3. Update `mapRow()` in the relevant `.service.ts` (snake_case → camelCase read)
4. Update `update()` allowlist in the same service (camelCase → snake_case write)
5. If needed in `create()`, add to the insert object

### Adding a New Service
1. **Check if a service already exists** for that domain — extend it instead of creating a duplicate
2. Use kebab-case: `feature-name.service.ts`
3. Place in `/services/`

### Versioning & GitHub Pushing
- **Always update the version number under the login page** when pushing changes to GitHub. Increment the version string in [LoginPage.tsx](file:///Users/shukriidriss/Downloads/siifmart%2080/components/LoginPage.tsx).

---

## Testing & Verification

### Automated Tests (Vitest)
- **New services** MUST have unit tests in `/tests/services/`
- **New utils** MUST have unit tests in `/tests/utils/`
- **Bug fixes** MUST include a regression test proving the fix works
- Run tests before committing: `npx vitest run`
- Run file size check: `npm run lint:size`

### Manual Verification
- After **any** code change, run `npx tsc --noEmit` to verify types
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
| Trigger | Action |
|---------|--------|
| Context file > 300 lines | Split into context (provider) + hooks (actions) |
| Component has 3+ tabs | Each tab → separate file |
| Modal > 200 lines | Separate file in `/modals/` subdirectory |
| Types used by only 1 file | Co-locate in that file, don't add to `types.ts` |
| Form > 100 lines | Extract to its own component |
| Utility used by 3+ files | Move to `/utils/` |
| Hook used by 1 component | Co-locate, don't create a separate file |

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

## ⚠️ 500-Line File Limit (STRICT)

**No file may exceed 500 lines of code. This is a hard rule with zero exceptions.**

When editing or creating any file, the AI MUST:

1. **Check the line count** of the file before and after changes.
2. **If a file is already over 500 lines**, refactor it down as part of the current task — don't make it worse.
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
- **No trade-offs**: Splitting must not reduce functionality, break imports, or introduce regressions. Run the dev server / build to verify after splitting.
- **Naming**: Split files should have clear, descriptive names reflecting their content (e.g., `OrderSummaryCard.tsx`, `useOrderFilters.ts`).

---

## Don'ts
- ❌ Don't use inline styles (use Tailwind or CSS variables)
- ❌ Don't call services directly for mutations
- ❌ Don't skip role checks for sensitive actions
- ❌ Don't hardcode site IDs
- ❌ Don't create duplicate mutation logic in components
- ❌ Don't push to GitHub without incrementing/verifying the version number in [LoginPage.tsx](file:///Users/shukriidriss/Downloads/siifmart%2080/components/LoginPage.tsx)
- ❌ Don't let any file exceed 500 lines — split into new files instead
- ❌ Don't leave `console.log` statements — remove or replace with `console.error`/`console.warn`
- ❌ Don't use `any` type — always define proper TypeScript types
- ❌ Don't create a new service if one already exists for that domain — extend it
- ❌ Don't put hooks in `/utils/` — they belong in `/hooks/`
- ❌ Don't eagerly import pages — use `React.lazy()` in App.tsx
- ❌ Don't add DB columns without a migration file
- ❌ Don't silently swallow errors with empty catch blocks
- ❌ Don't spread full objects into Supabase `update()` — use explicit allowlists
- ❌ Don't add a TypeScript field without updating the service mapper (read) and allowlist (write)
- ❌ Don't use the old `cyber-*` design tokens — use the sand/emerald/amber palette
