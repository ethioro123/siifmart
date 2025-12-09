# Employee Creation Summary

## Actions Taken
1.  **Created Seed Script**: Created `scripts/seed-employees.js` to automatically generate and insert employees.
2.  **Executed Seed**: Successfully created **16 employees** for the following roles:
    *   Admin
    *   Manager
    *   WMS
    *   POS
    *   Picker
    *   HR
    *   Auditor
    *   Driver

## Pending Actions (Database Update Required)
The following roles could **not** be created because the database schema restricts the allowed roles:
*   `finance_manager`
*   `procurement_manager`
*   `store_supervisor`
*   `inventory_specialist`
*   `cs_manager`
*   `it_support`

## How to Enable Remaining Roles
To allow these roles, you must update the database constraint.

1.  Open your Supabase Dashboard.
2.  Go to the **SQL Editor**.
3.  Open the file `update_roles_constraint.sql` (created in your project root) or copy the following SQL:

```sql
ALTER TABLE employees DROP CONSTRAINT employees_role_check;

ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN (
  'super_admin', 'admin', 'manager', 'wms', 'pos', 'picker', 'hr', 'auditor', 'driver',
  'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'
));
```

4.  Run the query.
5.  After updating the constraint, you can run the seed script again to create the remaining employees (you may need to uncomment the roles in `scripts/seed-employees.js` or I can update it for you).

## Script Location
The seed script is located at: `/Users/shukriidriss/Downloads/siifmart 80/scripts/seed-employees.js`
