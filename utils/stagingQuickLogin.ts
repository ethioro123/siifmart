import { SYSTEM_ROLES } from './roles';
import { isHqFacilitySite, isRegionalAdminFacilitySite } from './roleSegregation';
import { STAGING_PROJECT_REF } from '../supabase/functions/staging-quick-login/policy';

export type FacilityTierType = 'HQ' | 'Regional Administration' | 'Operation Sites';
export type StagingSiteType = 'HQ' | 'Regional Administration' | 'Store' | 'Warehouse' | 'Distribution Center';
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
    if (!headquarters && !regional && !['Store', 'Warehouse', 'Distribution Center'].includes(row.site?.type || '')) return null;
    const siteType = headquarters ? 'HQ' : regional ? 'Regional Administration'
        : row.site?.type as StagingSiteType;
    return {
        id: row.id, name: row.name, role: row.job_title || role?.label || row.role,
        roleId: row.role, level: role?.level || (global ? 1 : 10),
        levelTag: `L${role?.level || (global ? 1 : 10)}`,
        code: row.code || '', email: row.email, country, facilityTier, siteType,
        siteCode: row.site?.code || 'HQ-GLOBAL', siteName: row.site?.name || 'Global Headquarters'
    };
}

const QUICK_LOGIN_SITE_TYPES: StagingSiteType[] = [
    'HQ', 'Regional Administration', 'Store', 'Warehouse', 'Distribution Center'
];

/** Keep one representative site per country and facility type in the staging picker. */
export function selectRepresentativeStagingAccounts(accounts: StagingQuickAccount[]): StagingQuickAccount[] {
    const selected = new Set<string>();
    const groups = new Map<string, StagingQuickAccount[]>();

    for (const account of accounts) {
        if (account.country === 'GLOBAL') {
            selected.add(account.id);
            continue;
        }
        if (!QUICK_LOGIN_SITE_TYPES.includes(account.siteType)) continue;
        const key = `${account.country}:${account.siteType}:${account.siteCode}`;
        const group = groups.get(key) || [];
        group.push(account);
        groups.set(key, group);
    }

    for (const country of ['ET', 'KE'] as const) {
        for (const siteType of QUICK_LOGIN_SITE_TYPES) {
            const candidates = [...groups.entries()]
                .filter(([key]) => key.startsWith(`${country}:${siteType}:`))
                .sort(([keyA, accountsA], [keyB, accountsB]) =>
                    accountsB.length - accountsA.length || keyA.localeCompare(keyB));
            const representative = candidates[0]?.[1] || [];
            for (const account of representative) selected.add(account.id);
        }
    }

    return accounts.filter(account => selected.has(account.id));
}
