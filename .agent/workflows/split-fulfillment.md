---
description: Split Fulfillment.tsx (15k+ lines) into per-tab component files with shared context
---

# Split Fulfillment.tsx Into Per-Tab Components

> This workflow extracts each Fulfillment tab into its own component file while preserving all functionality. Follow these steps IN ORDER. Do NOT skip steps. Do NOT parallelize steps that depend on each other.

## Architecture Overview

```
BEFORE:  pages/Fulfillment.tsx (15,000+ lines, everything in one file)

AFTER:
  pages/Fulfillment.tsx                          → Shell (~500 lines: tabs, routing, context provider)
  components/fulfillment/FulfillmentContext.tsx   → Shared state & helpers (context + custom hook)
  components/fulfillment/DocksTab.tsx
  components/fulfillment/DriverTab.tsx
  components/fulfillment/ReceiveTab.tsx
  components/fulfillment/PickTab.tsx
  components/fulfillment/PackTab.tsx
  components/fulfillment/AssignTab.tsx
  components/fulfillment/PutawayTab.tsx
  components/fulfillment/ReplenishTab.tsx
  components/fulfillment/CountTab.tsx
  components/fulfillment/WasteTab.tsx
  components/fulfillment/ReturnsTab.tsx
  components/fulfillment/TransferTab.tsx
```

---

## PHASE 1: ANALYSIS (Read-Only — Do NOT Edit Any Files Yet)

### Step 1.1 — Map the tab JSX boundaries

Search for `activeTab === '` to find every tab panel's opening line. Each tab panel is a conditional block:
```tsx
{activeTab === 'TABNAME' && (
    <div>... hundreds of lines ...</div>
)}
```

Find the CLOSING `)}` of each block by counting the brace depth. Record a table like:

| Tab | Start Line | End Line | Approx Lines |
|-----|-----------|---------|--------------|
| DOCKS | ~3436 | ~4126 | ~690 |
| DRIVER | ~4127 | ~4892 | ~765 |
| RECEIVE | ~4893 | ~6664 | ~1771 |
| PICK | ~6665 | ~6986 | ~321 |
| PACK | ~6987 | ~7606 | ~619 |
| ASSIGN | ~7607 | ~8847 | ~1240 |
| PUTAWAY | ~8848 | ~9189 | ~341 |
| REPLENISH | ~9190 | ~9632 | ~442 |
| COUNT | ~9633 | ~10111 | ~478 |
| WASTE | ~10112 | ~10427 | ~315 |
| RETURNS | ~10428 | ~10922 | ~494 |
| TRANSFER | ~10923 | ~end | ~4000+ |

**VERIFY** these line numbers against the actual file before proceeding — they shift with every edit.

### Step 1.2 — Map the state variables

Search for `// ---` comment markers in lines 1-2000 to find state sections. For EACH state variable (`useState`, `useMemo`, `useRef`, `useEffect`), determine:
1. **Which tab(s) use it** — grep the variable name across the JSX tab blocks
2. **Is it SHARED** (used by 2+ tabs or by the shell) or **TAB-SPECIFIC** (used by exactly 1 tab)

Categorize into:
- **SHARED** → goes into `FulfillmentContext.tsx`
- **TAB-SPECIFIC** → goes into that tab's component file
- **SHELL** → stays in `Fulfillment.tsx` (e.g., `activeTab`, `canAccessTab`, `notifications`)

Key shared state you will likely find:
- `activeTab`, `setActiveTab`
- `selectedJob`, `setSelectedJob`
- `user`, `activeSite`, `sites`, `products`, `allProducts`
- `refreshData`, `addNotification`
- `wmsJobsService`, `productsService` (from DataContext)
- `t` (i18n translation function)
- Jobs lists: `activeJobs`, `historicalJobs`, `filteredProducts`
- Scanner state (if used across tabs)

### Step 1.3 — Map the helper functions

Search for `const handle` and `const submit` and `const create` in the component body (lines ~1700-2500). For each function:
1. Check which tab's JSX calls it (grep the function name in the JSX sections)
2. Classify as SHARED or TAB-SPECIFIC

### Step 1.4 — Map the modals

Many tabs have associated modals rendered OUTSIDE their `activeTab === 'X'` block. Search for modal patterns:
- `<Modal` components
- `fixed inset-0 z-50` overlay divs
- State vars like `show*Modal`, `is*ModalOpen`

Map each modal to its owning tab. The modal JSX travels WITH its tab.

---

## PHASE 2: CREATE THE SHARED CONTEXT

### Step 2.1 — Create `FulfillmentContext.tsx`

// turbo
```bash
mkdir -p "/Users/shukriidriss/Downloads/siifmart 80/components/fulfillment"
```

Create the context file with this structure:

```tsx
import React, { createContext, useContext } from 'react';
// ... all shared type imports

// 1. Define the context shape interface
export interface FulfillmentContextType {
    // Data from DataContext
    user: User | null;
    activeSite: any;
    sites: any[];
    products: Product[];
    allProducts: Product[];
    activeJobs: WMSJob[];
    historicalJobs: WMSJob[];
    refreshData: () => Promise<void>;
    addNotification: (type: string, message: string) => void;
    t: (key: string) => string;

    // Shared UI state
    activeTab: OpTab;
    setActiveTab: (tab: OpTab) => void;
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    
    // ... ALL shared state vars & setters
    // ... ALL shared helper functions
}

// 2. Create the context
const FulfillmentContext = createContext<FulfillmentContextType | null>(null);

// 3. Custom hook for consuming
export const useFulfillment = () => {
    const ctx = useContext(FulfillmentContext);
    if (!ctx) throw new Error('useFulfillment must be used within FulfillmentProvider');
    return ctx;
};

// 4. Provider component
export const FulfillmentProvider: React.FC<{
    value: FulfillmentContextType;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <FulfillmentContext.Provider value={value}>
        {children}
    </FulfillmentContext.Provider>
);
```

**CRITICAL RULE**: The context interface must list EVERY shared state variable and function. If you miss one, the tab that needs it will break. Use the analysis from Phase 1.

### Step 2.2 — Verify the context interface

For every property in `FulfillmentContextType`, grep the Fulfillment.tsx file to confirm it exists and is used by 2+ tabs. Remove anything that's only used by 1 tab.

---

## PHASE 3: EXTRACT TABS (One at a Time)

### CRITICAL RULES FOR EXTRACTION:

1. **Extract ONE tab at a time**, verify it compiles, then move to the next
2. **Start with the SMALLEST tab** (WASTE ~315 lines) to practice the pattern
3. **Extraction order** (smallest → largest to minimize risk):
   `WASTE → PUTAWAY → PICK → REPLENISH → COUNT → RETURNS → PACK → DOCKS → DRIVER → ASSIGN → RECEIVE → TRANSFER`
4. **After EACH extraction**, run `npx tsc --noEmit` to verify zero errors

### Step 3.X — Extract [TabName]Tab (repeat for each tab)

#### 3.X.1 — Create the tab file

```tsx
// components/fulfillment/[TabName]Tab.tsx
import React, { useState } from 'react';
import { useFulfillment } from './FulfillmentContext';
// ... tab-specific imports (icons, components, services)

export const [TabName]Tab: React.FC = () => {
    // 1. Pull shared state from context
    const {
        user, activeSite, sites, products, activeJobs,
        selectedJob, setSelectedJob, refreshData, addNotification, t,
        // ... only destructure what THIS tab actually uses
    } = useFulfillment();

    // 2. Tab-specific state (MOVE from Fulfillment.tsx)
    const [localState, setLocalState] = useState(...);

    // 3. Tab-specific handlers (MOVE from Fulfillment.tsx)
    const handleSomething = async () => { ... };

    // 4. Tab JSX (MOVE from Fulfillment.tsx — the content INSIDE the activeTab === 'X' block)
    return (
        <div>
            {/* Everything that was inside {activeTab === 'TABNAME' && ( ... )} */}
            {/* PLUS any modals that belong to this tab */}
        </div>
    );
};
```

#### 3.X.2 — Move the JSX

1. **CUT** everything between `{activeTab === 'TABNAME' && (` and its closing `)}` from Fulfillment.tsx
2. **PASTE** the inner content (not the conditional wrapper) into the tab component's return
3. **Replace** the cut block in Fulfillment.tsx with:
   ```tsx
   {activeTab === 'TABNAME' && <[TabName]Tab />}
   ```

#### 3.X.3 — Move tab-specific state

1. For each state variable identified as TAB-SPECIFIC in Phase 1.2, **CUT** it from Fulfillment.tsx and **PASTE** it into the tab component
2. For each tab-specific handler, do the same

#### 3.X.4 — Move associated modals

If the tab has modals rendered outside the `activeTab` block:
1. **CUT** the modal JSX from Fulfillment.tsx
2. **PASTE** it into the tab component's return (inside a fragment `<>...</>`)

#### 3.X.5 — Fix imports

1. Add all necessary imports to the tab file (icons, components, types, services)
2. Remove now-unused imports from Fulfillment.tsx

#### 3.X.6 — Verify

// turbo
```bash
cd "/Users/shukriidriss/Downloads/siifmart 80" && npx tsc --noEmit --pretty 2>&1 | head -40
```

**STOP if there are errors. Fix them before proceeding to the next tab.**

---

## PHASE 4: UPDATE THE SHELL

After all tabs are extracted, Fulfillment.tsx should contain:

1. **Imports** for all tab components and the context provider
2. **Shared state declarations** (the ones classified as SHARED in Phase 1)
3. **Context provider value** object assembling all shared state
4. **Tab bar UI** (the tab selector buttons)
5. **Tab routing** (the `activeTab === 'X' && <XTab />` blocks)
6. **Notifications** overlay
7. **FulfillmentProvider wrapper** around everything

```tsx
export default function FulfillmentPage() {
    // ... shared state declarations ...
    
    const contextValue: FulfillmentContextType = {
        user, activeSite, sites, products, allProducts,
        activeJobs, historicalJobs, refreshData, addNotification, t,
        activeTab, setActiveTab, selectedJob, setSelectedJob,
        // ... all shared state
    };

    return (
        <Protected requiredRoles={[...]}>
            <FulfillmentProvider value={contextValue}>
                {/* Tab bar */}
                <div>...</div>
                
                {/* Tab panels */}
                {activeTab === 'DOCKS' && <DocksTab />}
                {activeTab === 'DRIVER' && <DriverTab />}
                {activeTab === 'RECEIVE' && <ReceiveTab />}
                {/* ... etc */}
            </FulfillmentProvider>
        </Protected>
    );
}
```

---

## PHASE 5: FINAL VERIFICATION

// turbo
```bash
cd "/Users/shukriidriss/Downloads/siifmart 80" && npx tsc --noEmit --pretty 2>&1 | head -80
```

Then open EVERY tab in the browser and verify:
1. Tab switching works
2. Data loads correctly  
3. Modals open/close
4. Submit actions work
5. No console errors

---

## ANTI-PATTERNS — DO NOT DO THESE

1. ❌ **Do NOT extract all tabs in parallel** — extract one, verify, then the next
2. ❌ **Do NOT duplicate shared state** — use the context, never copy state into tabs
3. ❌ **Do NOT change any business logic** — this is a STRUCTURAL refactor only
4. ❌ **Do NOT rename variables** — keep identical names so diffs are clean and reviewable
5. ❌ **Do NOT try to "improve" the code** while extracting — solve one problem at a time
6. ❌ **Do NOT forget modals** — many tabs have modals rendered OUTSIDE the `activeTab` block
7. ❌ **Do NOT forget useEffect hooks** — some belong to specific tabs and must move with them
