import { SYSTEM_ROLES } from './roles';
import { isHqFacilitySite, isRegionalAdminFacilitySite } from './roleSegregation';
import { STAGING_PROJECT_REF } from '../supabase/functions/staging-quick-login/policy';

export type FacilityTierType = 'HQ' | 'Regional Administration' | 'Operation Sites';
export type StagingSiteType = 'HQ' | 'Regional Administration' | 'Store' | 'Warehouse' | 'Distribution Center' | 'Online Store';
export interface StagingQuickAccount {
    id: string; name: string; role: string; roleId: string; level: number; levelTag: string;
    code: string; email: string; country: 'ET' | 'KE' | 'GLOBAL';
    facilityTier: FacilityTierType; siteCode: string; siteName: string; siteType: StagingSiteType;
}
export interface StagingEmployeeRow {
    id: string; name: string; role: string; job_title: string; code: string | null; email: string;
    site: { code: string; name: string; type: string; country: string | null; region_code: string | null } | null;
}

export function checkIsLocalhost(hostname?: string, isDev?: boolean): boolean {
    const development = isDev ?? Boolean(import.meta.env.DEV);
    const host = hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname);
    return development && (['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) || host.endsWith('.localhost'));
}

export function isStagingQuickLoginAvailable(
    hostname?: string, isDev?: boolean, projectUrl = import.meta.env.VITE_SUPABASE_URL
): boolean {
    return checkIsLocalhost(hostname, isDev) && projectUrl === `https://${STAGING_PROJECT_REF}.supabase.co`;
}

export function mapStagingEmployee(row: StagingEmployeeRow): StagingQuickAccount | null {
    const role = SYSTEM_ROLES.find(item => item.id.toLowerCase() === row.role.toLowerCase());
    const global = ['super_admin', 'ceo'].includes(row.role.toLowerCase());
    const country = global ? 'GLOBAL' : row.site?.country?.toUpperCase();
    if (country !== 'GLOBAL' && country !== 'ET' && country !== 'KE') return null;
    const facility = row.site ? { ...row.site, region_code: row.site.region_code || undefined } : null;
    const headquarters = global || isHqFacilitySite(facility);
    const regional = !headquarters && isRegionalAdminFacilitySite(facility);
    const facilityTier: FacilityTierType = headquarters ? 'HQ' : regional ? 'Regional Administration' : 'Operation Sites';
    const siteType = headquarters ? 'HQ' : regional ? 'Regional Administration'
        : row.site?.type === 'Dark Store' ? 'Online Store' : row.site?.type as StagingSiteType;
    return {
        id: row.id, name: row.name, role: row.job_title || role?.label || row.role,
        roleId: row.role, level: role?.level || (global ? 1 : 4),
        levelTag: `L${role?.level || (global ? 1 : 4)}`,
        code: row.code || '', email: row.email, country, facilityTier, siteType,
        siteCode: row.site?.code || 'HQ-GLOBAL', siteName: row.site?.name || 'Global Headquarters'
    };
}
