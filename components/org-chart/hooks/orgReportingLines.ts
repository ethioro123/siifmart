// Enterprise Dual-Control Reporting Lines & Supervisory Metadata Engine
// Codified under SOP-ORG-036 & Rule 18 ("The Captain Owns the Ship")

import { RoleReportingMeta, HierarchyLevelConfig } from './orgReportingTypes';
import { L1_L5_REPORTING_REGISTRY } from './orgReportingL1L5Data';
import { L6_L8_REPORTING_REGISTRY } from './orgReportingL6L8Data';
import { L9_L10_REPORTING_REGISTRY } from './orgReportingL9L10Data';

export * from './orgReportingTypes';
export { L1_L5_REPORTING_REGISTRY } from './orgReportingL1L5Data';
export { L6_L8_REPORTING_REGISTRY } from './orgReportingL6L8Data';
export { L9_L10_REPORTING_REGISTRY } from './orgReportingL9L10Data';

export const ROLE_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    ...L1_L5_REPORTING_REGISTRY,
    ...L6_L8_REPORTING_REGISTRY,
    ...L9_L10_REPORTING_REGISTRY
};

export const getRoleReportingMeta = (role: string): RoleReportingMeta => {
    if (ROLE_REPORTING_REGISTRY[role]) {
        return ROLE_REPORTING_REGISTRY[role];
    }
    // Safe default for uncataloged roles
    return {
        role,
        level: 10,
        levelCategory: 'specialist',
        levelTag: 'L10 Staff',
        reportsToRole: 'shift_supervisor',
        reportsToLabel: 'Facility Supervisor',
        managesRoles: [],
        isManagerial: false
    };
};

export const HIERARCHY_LEVEL_CONFIGS: Record<number, HierarchyLevelConfig> = {
    1: {
        level: 1,
        title: 'Level 1: Global Executive Leadership',
        subtitle: 'Enterprise ownership, cross-border sovereignty & capital allocation',
        badge: 'L1 Global Exec',
        color: 'var(--theme-chart-1)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'crown'
    },
    2: {
        level: 2,
        title: 'Level 2: Country Managing Director',
        subtitle: 'National managing directorate, country P&L & sovereign operations',
        badge: 'L2 Country Exec',
        color: 'var(--theme-chart-4)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'crown'
    },
    3: {
        level: 3,
        title: 'Level 3: Country Functional Directors',
        subtitle: 'Country directors for Operations, Finance, Commercial, Supply Chain, HR, Technology & Compliance',
        badge: 'L3 Country Director',
        color: 'var(--theme-chart-2)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'building'
    },
    4: {
        level: 4,
        title: 'Level 4: Regional Operations Managers',
        subtitle: 'Multi-site regional command, cluster performance & territorial governance',
        badge: 'L4 Regional Ops',
        color: 'var(--theme-chart-5)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'building'
    },
    5: {
        level: 5,
        title: 'Level 5: Area & Regional Functional Managers',
        subtitle: 'Area leadership and regional functional managers across retail, supply chain, finance, commercial, people & security',
        badge: 'L5 Manager',
        color: 'var(--theme-chart-1)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'building'
    },
    6: {
        level: 6,
        title: 'Level 6: Facility Captains (Store & Warehouse)',
        subtitle: 'Primary facility command ("The Captain Owns the Ship") for stores & fulfillment centers',
        badge: 'L6 Facility Captain',
        color: 'var(--theme-chart-5)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'shield'
    },
    7: {
        level: 7,
        title: 'Level 7: Functional & Department Managers',
        subtitle: 'Site logistics, inventory control, security, dispatch, customer service & vendor managers',
        badge: 'L7 Dept Manager',
        color: 'var(--theme-chart-3)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'shield'
    },
    8: {
        level: 8,
        title: 'Level 8: Deputy & Shift Supervisors',
        subtitle: 'Assistant store managers, floor supervisors, fleet maintenance & shift leads',
        badge: 'L8 Supervisor',
        color: 'var(--theme-chart-3)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'shield'
    },
    9: {
        level: 9,
        title: 'Level 9: Corporate, Audit & Planning Specialists',
        subtitle: 'Auditors, accountants, treasury/tax/credit officers, buyers, planners, HR & IT specialists',
        badge: 'L9 Specialist',
        color: 'var(--theme-chart-1)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'zap'
    },
    10: {
        level: 10,
        title: 'Level 10: Frontline Store, Warehouse & Fleet Staff',
        subtitle: 'POS cashiers, sales associates, stock clerks, pickers, packers, receivers & drivers',
        badge: 'L10 Frontline',
        color: 'var(--theme-chart-7)',
        bgLight: 'var(--theme-bg-subtle)',
        bgDark: 'var(--theme-bg-subtle)',
        borderLight: 'var(--theme-border)',
        borderDark: 'var(--theme-border)',
        icon: 'zap'
    }
};
