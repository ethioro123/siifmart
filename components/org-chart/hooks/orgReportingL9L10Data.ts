import { RoleReportingMeta } from './orgReportingTypes';
import { L9_REPORTING_REGISTRY } from './orgReportingL9Data';
import { L10_REPORTING_REGISTRY } from './orgReportingL10Data';

export { L9_REPORTING_REGISTRY } from './orgReportingL9Data';
export { L10_REPORTING_REGISTRY } from './orgReportingL10Data';

// Hierarchy Levels 9 & 10: Operational Specialists & Frontline Workforce
export const L9_L10_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    ...L9_REPORTING_REGISTRY,
    ...L10_REPORTING_REGISTRY
};
