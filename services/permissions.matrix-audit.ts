import type { Permission } from './permissions.service';

export const HEAD_OF_AUDIT_PERMISSIONS: Permission[] = [
    'dashboard.view',
    'sales.view', 'sales.view_reports',
    'inventory.view',
    'finance.view', 'finance.view_reports', 'finance.view_payroll',
    'employees.view',
    'settings.view', 'settings.view_logs'
];
