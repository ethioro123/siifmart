import { RoleReportingMeta } from './orgReportingTypes';
import { L1_L2_REPORTING_REGISTRY } from './orgReportingL1L2Data';
import { L3_L5_REPORTING_REGISTRY } from './orgReportingL3L5Data';

export { L1_L2_REPORTING_REGISTRY } from './orgReportingL1L2Data';
export { L3_L5_REPORTING_REGISTRY } from './orgReportingL3L5Data';

// Hierarchy Levels 1 through 5: Executive Leadership, Directorates, Regional Leadership
export const L1_L5_REPORTING_REGISTRY: Record<string, RoleReportingMeta> = {
    ...L1_L2_REPORTING_REGISTRY,
    ...L3_L5_REPORTING_REGISTRY
};
