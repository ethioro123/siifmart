# Employee Loading Fix

## Problem Identified
The employees were in the database (28 total) but not showing in the frontend because of a data loading conflict:

1. `loadGlobalData()` was loading all employees correctly
2. BUT `loadSiteData(siteId)` was being called when `activeSiteId` changed
3. `loadSiteData` was loading employees filtered by `siteId`, which overwrote the global employees
4. This resulted in only showing employees for the current site instead of all employees

## Solution Applied
Changed `loadSiteData` in `DataContext.tsx` (line 236) from:
```typescript
employeesService.getAll(siteId)  // ❌ Site-filtered
```

To:
```typescript
employeesService.getAll()  // ✅ Global - Always load all employees
```

## Rationale
Employees should be visible across the entire organization for:
- **HR Management**: HR needs to see all staff
- **Payroll**: Finance needs to process payroll for all employees
- **Org Chart**: Organizational structure spans all sites
- **Task Assignment**: Managers may assign tasks across sites

Site-specific filtering should only apply to:
- Products (inventory is site-specific)
- Sales (transactions are site-specific)
- Purchase Orders (orders are site-specific)
- WMS Jobs (fulfillment is site-specific)

## Verification
After this fix:
1. Refresh the browser (Cmd+Shift+R)
2. Navigate to http://localhost:3002/#/employees
3. You should now see all 28 employees
4. Check the console - you should see: `Employees: 28`

## Additional Logging
Added console logging to show data counts after loading:
- Products count
- Employees count
- Orders count

This helps verify data is loading correctly.
