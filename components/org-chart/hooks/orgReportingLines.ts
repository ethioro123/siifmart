// Enterprise Dual-Control Reporting Lines & Supervisory Metadata Engine
// Codified under SOP-ORG-036 & Rule 18 ("The Captain Owns the Ship")

import { RoleReportingMeta, HierarchyLevelConfig } from './orgReportingTypes';
import { L1_L3_REPORTING_REGISTRY } from './orgReportingL1L3Data';
import { L4_REPORTING_REGISTRY } from './orgReportingL4Data';

export * from './orgReportingTypes';
export { L1_L3_REPORTING_REGISTRY } from './orgReportingL1L3Data';
export { L4_REPORTING_REGISTRY } from './orgReportingL4Data';

export const ROLE_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    ...L1_L3_REPORTING_REGISTRY,
    ...L4_REPORTING_REGISTRY
};

export const getRoleReportingMeta = (role: string): RoleReportingMeta => {
    if (ROLE_REPORTING_REGISTRY[role]) {
        return ROLE_REPORTING_REGISTRY[role];
    }
    // Safe default for uncataloged roles
    return {
        role,
        level: 4,
        levelCategory: 'specialist',
        levelTag: 'L4 Staff',
        reportsToRole: 'shift_lead',
        reportsToLabel: 'Facility Supervisor',
        managesRoles: [],
        isManagerial: false
    };
};

export const HIERARCHY_LEVEL_CONFIGS: Record<number, HierarchyLevelConfig> = {
    1: {
        level: 1,
        title: 'Level 1: Executive C-Suite Leadership',
        subtitle: 'Enterprise strategy, multi-country tenancy governance & capital allocation',
        badge: 'L1 Executive',
        color: '#6366f1',
        bgLight: '#eef2ff',
        bgDark: '#1e1b4b',
        borderLight: '#c7d2fe',
        borderDark: '#4338ca',
        icon: 'crown'
    },
    2: {
        level: 2,
        title: 'Level 2: Corporate & Regional Directorates',
        subtitle: 'Multi-site cluster leadership, budgets, cross-functional compliance & supply chain networks',
        badge: 'L2 Director',
        color: '#2C5E3B',
        bgLight: '#f0f4f0',
        bgDark: '#18241b',
        borderLight: '#A9CBA2',
        borderDark: '#2C5E3B',
        icon: 'building'
    },
    3: {
        level: 3,
        title: 'Level 3: Facility Operations Managers & Floor Supervisors',
        subtitle: 'Store captains, warehouse fulfillment leads, fleet dispatch & shift supervisors',
        badge: 'L3 Supervisor',
        color: '#d97706',
        bgLight: '#fffbeb',
        bgDark: '#2c2112',
        borderLight: '#fde68a',
        borderDark: '#78350f',
        icon: 'shield'
    },
    4: {
        level: 4,
        title: 'Level 4: Operational Specialists & Frontline Workforce',
        subtitle: 'POS cashiers, inbound receivers, order pickers, delivery drivers, buyers & accountants',
        badge: 'L4 Specialist',
        color: '#0284c7',
        bgLight: '#f0f9ff',
        bgDark: '#0c2333',
        borderLight: '#bae6fd',
        borderDark: '#0369a1',
        icon: 'zap'
    }
};
