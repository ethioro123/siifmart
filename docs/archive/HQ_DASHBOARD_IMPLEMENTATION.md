# HQ Dashboard Implementation

## Overview
We have implemented the **HQ Command Center**, a specialized dashboard for Global Roles (Super Admin, HR, Finance). This dashboard provides a high-level view of the entire network's performance without needing to switch between sites.

## Key Features
1.  **Aggregated Metrics**:
    *   **Total Network Revenue**: Sum of sales from all sites.
    *   **Active Workforce**: Total employee count across the organization.
    *   **Inventory Alerts**: Network-wide count of low stock or out-of-stock items.
    *   **Pending Orders**: Total purchase orders awaiting approval.

2.  **Site Performance Matrix**:
    *   A table displaying each site's key stats: Revenue, Staff Count, and Active Alerts.
    *   **"Manage" Action**: Allows the admin to instantly switch context to a specific site to drill down into details.

3.  **Global Data Loading**:
    *   Implemented `loadGlobalData` in `DataContext` to fetch aggregated data (Products, Sales, Orders, Employees) from all sites in the background.
    *   This ensures the HQ Dashboard has real-time visibility into the entire operation.

## Architecture
*   **Frontend**: New `HQDashboard.tsx` page.
*   **Routing**: Added `/hq` route protected by `dashboard` module permission.
*   **Navigation**: Added "HQ Command" link to the Sidebar for relevant roles.
*   **State**: Added `allProducts`, `allSales`, `allOrders` to `DataContext` to hold network-wide data separate from the site-specific `products`, `sales`, etc.

## Next Steps
*   **RLS Policies**: Ensure the database RLS policies allow global roles to fetch this aggregated data while restricting local users.
*   **Optimization**: As data grows, replace client-side aggregation with server-side SQL views or Supabase Edge Functions to improve performance.
