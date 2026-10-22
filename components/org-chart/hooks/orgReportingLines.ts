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
        reportsToRole: 'shift_lead',
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
        color: '#6366f1',
        bgLight: '#eef2ff',
        bgDark: '#1e1b4b',
        borderLight: '#c7d2fe',
        borderDark: '#4338ca',
        icon: 'crown'
    },
    2: {
        level: 2,
        title: 'Level 2: Country Executive Leadership',
        subtitle: 'National managing directorate, country P&L & sovereign operations',
        badge: 'L2 Country Exec',
        color: '#7c3aed',
        bgLight: '#f5f3ff',
        bgDark: '#2e1065',
        borderLight: '#ddd6fe',
        borderDark: '#5b21b6',
        icon: 'crown'
    },
    3: {
        level: 3,
        title: 'Level 3: Corporate HQ Directorate Heads',
        subtitle: 'National functional heads across Operations, Finance, HR, Supply Chain & Audit',
        badge: 'L3 HQ Director',
        color: '#2C5E3B',
        bgLight: '#f0f4f0',
        bgDark: '#18241b',
        borderLight: '#A9CBA2',
        borderDark: '#2C5E3B',
        icon: 'building'
    },
    4: {
        level: 4,
        title: 'Level 4: Regional Operations Managers',
        subtitle: 'Multi-site regional command, cluster performance & territorial governance',
        badge: 'L4 Regional Dir',
        color: '#0f766e',
        bgLight: '#f0fdfa',
        bgDark: '#134e4a',
        borderLight: '#99f6e4',
        borderDark: '#115e59',
        icon: 'building'
    },
    5: {
        level: 5,
        title: 'Level 5: Regional Department Managers',
        subtitle: 'Territorial leads for procurement, finance, merchandising, HR, logistics & security',
        badge: 'L5 Regional Lead',
        color: '#0369a1',
        bgLight: '#f0f9ff',
        bgDark: '#0c2333',
        borderLight: '#bae6fd',
        borderDark: '#0369a1',
        icon: 'building'
    },
    6: {
        level: 6,
        title: 'Level 6: Facility Captains (Store & Warehouse)',
        subtitle: 'Primary facility command ("The Captain Owns the Ship") for stores & fulfillment centers',
        badge: 'L6 Facility Captain',
        color: '#0d9488',
        bgLight: '#f0fdfa',
        bgDark: '#11302e',
        borderLight: '#99f6e4',
        borderDark: '#0f766e',
        icon: 'shield'
    },
    7: {
        level: 7,
        title: 'Level 7: Functional & Department Managers',
        subtitle: 'Site logistics, inventory control, security, dispatch, customer service & vendor managers',
        badge: 'L7 Dept Manager',
        color: '#d97706',
        bgLight: '#fffbeb',
        bgDark: '#2c2112',
        borderLight: '#fde68a',
        borderDark: '#78350f',
        icon: 'shield'
    },
    8: {
        level: 8,
        title: 'Level 8: Deputy & Shift Supervisors',
        subtitle: 'Assistant store managers, floor supervisors, fleet maintenance & shift leads',
        badge: 'L8 Supervisor',
        color: '#ea580c',
        bgLight: '#fff7ed',
        bgDark: '#321910',
        borderLight: '#fed7aa',
        borderDark: '#9a3412',
        icon: 'shield'
    },
    9: {
        level: 9,
        title: 'Level 9: Corporate, Audit & Planning Specialists',
        subtitle: 'Auditors, accountants, treasury/tax/credit officers, buyers, planners, HR & IT specialists',
        badge: 'L9 Specialist',
        color: '#0284c7',
        bgLight: '#f0f9ff',
        bgDark: '#0c2333',
        borderLight: '#bae6fd',
        borderDark: '#0369a1',
        icon: 'zap'
    },
    10: {
        level: 10,
        title: 'Level 10: Frontline Store, Warehouse & Fleet Staff',
        subtitle: 'POS cashiers, sales associates, stock clerks, pickers, packers, receivers & drivers',
        badge: 'L10 Frontline',
        color: '#475569',
        bgLight: '#f8fafc',
        bgDark: '#1e293b',
        borderLight: '#cbd5e1',
        borderDark: '#334155',
        icon: 'zap'
    }
};
