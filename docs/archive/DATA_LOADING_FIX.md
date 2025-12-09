# Data Loading Architecture Update

## Problem
Users reported that stores and warehouses were not loading their data accordingly. When switching sites, data from other sites (or all sites) was visible, leading to confusion and potential errors.

## Root Cause
The `DataContext` was loading **all** data (products, orders, sales, etc.) for **all** sites on initial load. While there was some client-side filtering logic (`filteredProducts`, etc.), it was either bypassed or insufficient, and the `loadData` function was not re-triggered when the active site changed.

## Solution
We refactored `DataContext.tsx` to implement a **site-specific data loading strategy**:

1.  **Split `loadData`**:
    *   `loadSites()`: Runs once on mount to fetch the list of available sites.
    *   `loadSiteData(siteId)`: Runs whenever `activeSiteId` changes.

2.  **Server-Side Filtering**:
    *   Updated `loadSiteData` to pass the `siteId` to all service `getAll` methods (e.g., `productsService.getAll(siteId)`).
    *   This ensures that the backend (Supabase) returns only the data relevant to the active site.

3.  **State Management**:
    *   The global state variables (`products`, `orders`, `sales`, etc.) now hold **only** the data for the active site.
    *   Removed redundant client-side filtering memos (`filteredProducts`, etc.) as the state is now pre-filtered.

## Benefits
*   **Correctness**: Users only see data for the site they are currently managing.
*   **Performance**: Reduced payload size by fetching only necessary data.
*   **Scalability**: The application can now handle many sites without loading the entire database into memory.

## Verified Components
*   **Warehouse Operations**: Now displays POs and Jobs only for the active warehouse.
*   **POS**: Now displays Products and Sales only for the active store.
*   **Inventory**: Now displays Stock and Movements only for the active site.
