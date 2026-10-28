# SIIFMART Engineering and Performance Rules

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

### Design standard — 29 October 2026, Revision B

- Follow the canonical [SIIFMART Design Standard](../../docs/APPLE_DESIGN_GUIDE.md) and its focused chapters. The repository-root `APPLE_DESIGN_GUIDE.md` is an entry-point pointer, not a second specification.
- Chapters 14–17 define platform-neutral component anatomy, exact defaults, state/theme pairs, adaptive behavior and runnable reference checks. Use these for deliberately migrated shared components; do not assume the reference palette is already deployed.
- `styles/theme.css` owns semantic colors, radii, spacing, control sizes, motion values and existing material utilities; `index.css` maps them into Tailwind. These are SIIFMART values, not official Apple web presets.
- Preserve the corporate wordmark in `components/Logo.tsx`; use the shared neutral primary-action, accent and semantic-status roles throughout the application.
- Readable content surfaces are the default for tables, forms, financial evidence, modal bodies and scanning work. Restrained material may enhance navigation or temporary chrome only when legibility and measured rendering support it. Existing `.glass-*` classes are optional utilities, not mandatory visual tiers.
- Solid-surface and performance fallbacks apply in **every** module when accessibility, browser support or measured hardware conditions require them. Fulfillment has especially strict repeated-scanning needs; it is not the only module allowed to use an opaque fallback.
- The appearance default is **System**, with explicit Light/Dark overrides retained through `hooks/useTheme.ts`. Respect reduced motion, forced colors and a supported reduced-transparency/solid fallback.
- Verify contrast on actual rendered foreground/background pairs in both themes. Token names and comments do not certify WCAG. Target WCAG 2.2 AA; enhanced internal targets are identified separately in the handbook.
- Keep approval awareness compact, use business display codes rather than UUIDs as primary labels, and distinguish pending, confirmed, stale and unavailable states.
- POS/WMS text changes still require synchronized English, Amharic and Afaan Oromoo translations in the established dictionaries, including errors, modal text and accessible labels.

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

- Lazy-load route-level pages and unusually heavy optional features; keep the initial route bundle focused.
- Measure before optimizing. Use React Profiler, browser performance tools, bundle analysis, and realistic data volumes to identify the actual bottleneck.
- Prefer simple rendering and stable state boundaries. Add `memo`, `useMemo`, or `useCallback` only when profiling shows repeated work or prop churn is material; unnecessary memoization adds complexity and can hide stale dependencies.
- Use server pagination for large datasets. Virtualize only when rendered row count or row complexity causes measurable scrolling/render delays; choose the threshold from device testing rather than a fixed item count.
- Defer below-the-fold images and non-critical modules. Keep above-the-fold content eager and avoid delaying essential workflows.
- Avoid repeated network requests, broad invalidations, synchronous heavy work, and unbounded client caches. Define and measure budgets for the critical route and device class.

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

## Mobile Performance: POS and Fulfillment

POS and Fulfillment run on phones and tablets. Keep common actions responsive on supported devices, and validate performance on representative hardware. Fulfillment has additional low-end device constraints because scanning is continuous and devices may have limited memory.

### Animation and Rendering
- Prefer short transitions of `transform` and `opacity` for frequent interactions. Avoid animating layout or paint-heavy properties in scrolling/scanning flows.
- Avoid `transition-all`; animate only the properties that change. Respect reduced-motion preferences.
- Keep blur and large shadows off scrolling or frequently re-rendered Fulfillment surfaces. Use solid tokenized surfaces on constrained devices.
- Add animation libraries only when a clear interaction need justifies their bundle and runtime cost.

### Touch and Interaction
- Provide at least 44×44 CSS-pixel targets where practical; make primary scanning actions larger when gloves, movement, or rugged hardware warrant it.
- Never make an essential action hover-only. Support keyboard and assistive technology input as well as touch.
- Debounce or defer expensive search work based on measured request/render cost; keep local filtering immediate when the dataset is small.
- Prefer direct, forgiving controls in scan-first flows. Use a dropdown when it is the clearest accessible control and does not slow the task.

### Performance Checks
- Lazy-load rarely used, heavy dialogs and charts when it improves route startup; do not add async delay to a frequent critical action without evidence.
- Keep scanning feedback immediate; move non-critical work off the input/paint path and avoid arbitrary timers as a substitute for profiling.
- Validate critical workflows on representative mobile devices and network conditions. Record regressions against a measured baseline instead of relying on a single simulated network preset.

