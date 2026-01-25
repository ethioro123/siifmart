# SIIFMART AI Development Rules

> These rules guide AI assistants in developing SIIFMART consistently and correctly.

## Architecture Overview

```
/pages/          → Full-page components (routes)
/components/     → Reusable UI components
/contexts/       → React contexts (CentralStore, DataContext, LanguageContext)
/hooks/          → Custom React hooks (mutations, queries)
/services/       → API layer (supabase.service.ts)
/types.ts        → All TypeScript interfaces and types
/utils/          → Helper functions
/migrations/     → SQL schema migrations
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

### Design Tokens
- Primary: `bg-cyber-primary`, `text-cyber-primary`
- Background: `bg-cyber-black`, `bg-cyber-dark`
- Borders: `border-white/10`, `border-white/20`

---

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
2. Add route in `/App.tsx`
3. Add sidebar link in `/components/Sidebar.tsx`
4. Add module to `ProtectedRoute` permissions

### Adding a Database Column
1. Create migration in `/migrations/`
2. Run SQL in Supabase
3. Update interface in `/types.ts`
4. Update service mapper in `supabase.service.ts`

---

## Don'ts
- ❌ Don't use inline styles (use Tailwind or CSS variables)
- ❌ Don't call services directly for mutations
- ❌ Don't skip role checks for sensitive actions
- ❌ Don't hardcode site IDs
- ❌ Don't create duplicate mutation logic in components
