// Reporting Hierarchy & Supervisory Metadata Types
// Codified under SOP-ORG-036 & Rule 18 ("The Captain Owns the Ship")

export type HierarchyLevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface RoleReportingMeta {
    role: string;
    level: HierarchyLevelNumber;
    levelCategory: 'executive' | 'director' | 'supervisor' | 'specialist';
    levelTag: string;
    reportsToRole: string | null;
    reportsToLabel: string;
    dottedLineRole?: string | null;
    dottedLineLabel?: string | null;
    managesRoles: string[];
    isManagerial: boolean;
}

export interface HierarchyLevelConfig {
    level: HierarchyLevelNumber;
    title: string;
    subtitle: string;
    badge: string;
    color: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    icon: string;
}
