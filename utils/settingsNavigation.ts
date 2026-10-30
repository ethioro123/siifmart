import { hasPermission, PERMISSIONS } from './permissions';

export type SettingsTab = 'general' | 'inventory' | 'pos' | 'discounts' | 'finance' | 'hr' | 'roles' | 'locations' | 'regions' | 'infrastructure' | 'integrations' | 'security' | 'notifications' | 'data' | 'audit' | 'gamification';
type Group = 'Operations' | 'People' | 'Finance' | 'Technology' | 'Governance';
interface SettingsSection {
    id: SettingsTab;
    label: string;
    group: Group;
    permission: keyof typeof PERMISSIONS;
    regional?: boolean;
    enterprise?: boolean;
}
export const SETTINGS_SECTIONS: SettingsSection[] = [
    { id: 'general', label: 'General & Slogan', group: 'Operations', permission: 'ACCESS_SETTINGS' },
    { id: 'locations', label: 'Locations & Sites', group: 'Operations', permission: 'MANAGE_WAREHOUSE', regional: true },
    { id: 'regions', label: 'Regional Administration', group: 'Operations', permission: 'ACCESS_REGIONAL_OPS', regional: true },
    { id: 'inventory', label: 'WMS & Inbound Rules', group: 'Operations', permission: 'MANAGE_WAREHOUSE' },
    { id: 'pos', label: 'POS & Retail Station', group: 'Operations', permission: 'EDIT_OPERATIONAL_SETTINGS', regional: true },
    { id: 'discounts', label: 'Discount & Promo Codes', group: 'Operations', permission: 'EDIT_OPERATIONAL_SETTINGS', regional: true },
    { id: 'hr', label: 'HR & Workforce Policy', group: 'People', permission: 'EDIT_EMPLOYEE' },
    { id: 'gamification', label: 'Warehouse Gamification', group: 'People', permission: 'MANAGE_WAREHOUSE', enterprise: true },
    { id: 'finance', label: 'Financial & Tax Policy', group: 'Finance', permission: 'ACCESS_FINANCE' },
    { id: 'infrastructure', label: 'Infrastructure & Devices', group: 'Technology', permission: 'EDIT_SYSTEM_SETTINGS', regional: true },
    { id: 'integrations', label: 'API & Integrations', group: 'Technology', permission: 'EDIT_SYSTEM_SETTINGS', regional: true, enterprise: true },
    { id: 'data', label: 'Data Management', group: 'Technology', permission: 'EDIT_SYSTEM_SETTINGS', enterprise: true },
    { id: 'roles', label: 'Roles & Zero-Trust', group: 'Governance', permission: 'MANAGE_ROLES', enterprise: true },
    { id: 'security', label: 'Loss Prevention & PIN', group: 'Governance', permission: 'EDIT_SYSTEM_SETTINGS', enterprise: true },
    { id: 'audit', label: 'System Audit Log', group: 'Governance', permission: 'VIEW_AUDIT_LOGS', regional: true, enterprise: true },
    { id: 'notifications', label: 'Alert Notifications', group: 'Governance', permission: 'ACCESS_SETTINGS', regional: true, enterprise: true }
];
export const SETTINGS_TAB_LABELS = Object.fromEntries(SETTINGS_SECTIONS.map(section => [section.id, section.label])) as Record<SettingsTab, string>;
export function visibleSettingsSections(role: Parameters<typeof hasPermission>[0], regional: boolean, enterprise: boolean, search = '') {
    const term = search.trim().toLowerCase();
    return SETTINGS_SECTIONS.filter(section =>
        hasPermission(role, section.permission) &&
        (regional ? section.regional : !section.enterprise || enterprise) &&
        `${section.label} ${section.group}`.toLowerCase().includes(term)
    );
}
