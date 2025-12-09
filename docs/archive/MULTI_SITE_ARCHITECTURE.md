# Brainstorming: Multi-Site Data Architecture & Unified Access

## The Goal
1.  **Strict Isolation**: Store A must never see Store B's data (unless authorized).
2.  **Unified Access**: Super Admin, HR, and Admin need a "God View" (HQ Mode) without constant site switching.
3.  **Performance**: Loading *all* data for *all* sites at once for an Admin will crash the browser. We need a smart loading strategy.

---

## 1. The Security Layer: Row Level Security (RLS)
This is the foundation. We move the security logic from the "Frontend" (React) to the "Database" (Supabase). This ensures that even if the frontend code has a bug, the data remains secure.

### Proposed Policies
*   **The "Local" Policy (Cashiers, Pickers, Store Managers)**
    *   *Rule*: `SELECT * FROM table WHERE site_id = auth.user.site_id`
    *   *Effect*: When a cashier logs in, Supabase *automatically* filters every query to only return rows for their assigned site. They physically cannot fetch other data.

*   **The "Global" Policy (Super Admin, HR, Finance, HQ)**
    *   *Rule*: `SELECT * FROM table` (No `site_id` restriction)
    *   *Effect*: These roles have permission to see everything.

---

## 2. The Frontend Architecture: "HQ Mode" vs "Site Mode"

We need to split the application state logic based on the user's role.

### A. For Local Users (e.g., Cashier at "Bole Store")
*   **Login**: System detects `user.site_id = 'ST-01'`.
*   **Context**: `activeSiteId` is locked to `'ST-01'`.
*   **Data Loading**: Calls `loadSiteData('ST-01')`.
*   **UI**: Site Switcher is **hidden**. They only see their store.

### B. For Global Users (e.g., HR Manager)
*   **Login**: System detects `user.role = 'hr_manager'`.
*   **Context**: `activeSiteId` defaults to `'HQ'` (Virtual Site) or `null`.
*   **Data Loading (Smart Strategy)**:
    *   **Employees**: Loads **ALL** employees from all sites (Volume: Low).
    *   **Sales/Inventory**: Loads **Aggregated Stats** (e.g., "Total Sales by Site") instead of raw rows (Volume: High).
*   **UI**:
    *   **Dashboard**: Shows a map or list of all sites with summary stats.
    *   **Site Switcher**: Visible. Allows "drilling down".
    *   **Drill Down**: If they select "Bole Store", the context switches to `loadSiteData('ST-01')` and they see the detailed view (just like a local user).

---

## 3. Implementation Plan

### Step 1: Database Security (RLS)
We need to implement the RLS policies in Supabase.
*   *Action*: Create a migration to enable RLS on all tables and define the policies based on `employees.role`.

### Step 2: Smart Data Context
Refactor `DataContext.tsx` to handle the "Global" role.

```typescript
// Pseudo-code for new loadData logic
const loadData = async () => {
  if (user.isGlobalRole) {
    // 1. Load Global Entities (Low Volume)
    const employees = await employeesService.getAll(); // No siteId filter
    const suppliers = await suppliersService.getAll();
    
    // 2. Load Aggregates for High Volume Data
    const salesStats = await analyticsService.getGlobalSalesStats(); 
    const stockStats = await analyticsService.getGlobalStockStats();
    
    setGlobalState({ employees, suppliers, salesStats, stockStats });
  } else {
    // Existing logic for local users
    loadSiteData(user.siteId);
  }
}
```

### Step 3: The "HQ" Dashboard
Create a new landing page for Global Roles.
*   **HR View**: A master list of all 28 employees, grouped by site.
*   **Admin View**: A table showing "Site Name | Today's Sales | Active Issues".
*   **Inventory View**: A master search that checks *all* warehouses for a SKU (e.g., "Where is Product X?").

---

## Summary of Benefits
1.  **Zero Leakage**: RLS guarantees Store A never sees Store B.
2.  **Efficiency**: Admins don't load 100,000 sales records on login; they load summaries and drill down when needed.
3.  **Convenience**: HR and Admins have a single "Command Center" to manage the entire network.
