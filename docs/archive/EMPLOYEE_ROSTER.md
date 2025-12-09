# Employee Structure Update

## Change Summary
Updated the employee seeding to create **1 employee per role** instead of 2.

## Current Employee Roster (14 Total)

### Management & Administration (4)
1. **Admin** - admin@siifmart.com
2. **Manager** - manager@siifmart.com
3. **Finance Manager** - finance.manager@siifmart.com
4. **Procurement Manager** - procurement.manager@siifmart.com

### Human Resources & Support (3)
5. **HR** - hr@siifmart.com
6. **IT Support** - it.support@siifmart.com
7. **CS Manager** - cs.manager@siifmart.com

### Store Operations (3)
8. **Store Supervisor** - store.supervisor@siifmart.com
9. **POS** - pos@siifmart.com
10. **Inventory Specialist** - inventory.specialist@siifmart.com

### Warehouse & Logistics (4)
11. **WMS** - wms@siifmart.com
12. **Picker** - picker@siifmart.com
13. **Driver** - driver@siifmart.com
14. **Auditor** - auditor@siifmart.com

## Distribution
Each employee is assigned to one of the 14 sites in a round-robin fashion.

## Email Format
All employees use the format: `{role}@siifmart.com`
- Example: `admin@siifmart.com`, `finance.manager@siifmart.com`

## Scripts Used
- `scripts/clear-employees.js` - Removed all existing employees
- `scripts/seed-employees.js` - Created new employees (1 per role)
- `scripts/check-employees.js` - Verified the employee roster

## Verification
Run `node scripts/check-employees.js` to see the current employee roster.

## Next Steps
After refreshing the browser, you should see exactly 14 employees in the Employees page.
