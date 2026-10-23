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
    const role = SYSTEM_ROLES.find(item => item.id === row.role);
    if (!role) return null;
    const global = row.role === 'group_ceo';
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
        id: row.id, name: row.name, role: role.label,
        roleId: role.id, level: role.level,
        levelTag: `L${role.level}`,
        code: row.code || '', email: row.email, country, facilityTier, siteType,
        siteCode: row.site?.code || 'HQ-GLOBAL', siteName: row.site?.name || 'Global Headquarters'
    };
}

const QUICK_LOGIN_SITE_TYPES: StagingSiteType[] = [
    'HQ', 'Regional Administration', 'Store', 'Warehouse', 'Distribution Center'
];

/** Explicitly excluded sites from staging quick login (e.g. Bishoftu Lakefront Supermarket) */
export const EXCLUDED_STAGING_QUICK_LOGIN_SITE_CODES = new Set(['ET-ADA-STR-02']);

/** Preferred operational store sites for Ethiopia staging quick login */
export const PREFERRED_STAGING_STORE_SITE_CODES = new Set(['ET-ADD-STR-02', 'ET-ADD-STR-03']);

/** Sites with synthetic coverage fixtures where roles should be deduplicated to 1 employee per role */
const DEDUPLICATE_ROLE_SITE_CODES = new Set(['ET-ADD-DC-01', 'ET-ADD-STR-02', 'ET-ADD-STR-03']);

function deduplicateSiteRoleIds(siteAccounts: StagingQuickAccount[]): Set<string> {
    const keptIds = new Set<string>();
    const roleSeen = new Set<string>();

    const sorted = [...siteAccounts].sort((a, b) => {
        const aInvalid = a.email.endsWith('.invalid');
        const bInvalid = b.email.endsWith('.invalid');
        if (aInvalid !== bInvalid) return aInvalid ? 1 : -1;
        const aTest = a.name.startsWith('[TEST]');
        const bTest = b.name.startsWith('[TEST]');
        if (aTest !== bTest) return aTest ? 1 : -1;
        return a.code.localeCompare(b.code) || a.id.localeCompare(b.id);
    });

    for (const acc of sorted) {
        if (!roleSeen.has(acc.roleId)) {
            roleSeen.add(acc.roleId);
            keptIds.add(acc.id);
        }
    }
    return keptIds;
}

/** Show all regional and receiving facilities; keep representative HQ and stores. */
export function selectRepresentativeStagingAccounts(accounts: StagingQuickAccount[]): StagingQuickAccount[] {
    const selected = new Set<string>();
    const groups = new Map<string, StagingQuickAccount[]>();

    for (const account of accounts) {
        if (EXCLUDED_STAGING_QUICK_LOGIN_SITE_CODES.has(account.siteCode) ||
            account.siteName.toLowerCase().includes('bishoftu')) {
            continue;
        }

        if (account.country === 'GLOBAL' || account.facilityTier === 'Regional Administration' ||
            account.siteType === 'Warehouse' || account.siteType === 'Distribution Center') {
            selected.add(account.id);
            continue;
        }

        if (PREFERRED_STAGING_STORE_SITE_CODES.has(account.siteCode)) {
            selected.add(account.id);
            continue;
        }

        if (!QUICK_LOGIN_SITE_TYPES.includes(account.siteType)) continue;
        const key = `${account.country}:${account.siteType}:${account.siteCode}`;
        const group = groups.get(key) || [];
        group.push(account);
        groups.set(key, group);
    }

    const hasPreferredEtStores = accounts.some(a => PREFERRED_STAGING_STORE_SITE_CODES.has(a.siteCode));

    for (const country of ['ET', 'KE'] as const) {
        for (const siteType of QUICK_LOGIN_SITE_TYPES) {
            if (country === 'ET' && siteType === 'Store' && hasPreferredEtStores) {
                continue;
            }

            const candidates = [...groups.entries()]
                .filter(([key]) => key.startsWith(`${country}:${siteType}:`))
                .sort(([keyA, accountsA], [keyB, accountsB]) =>
                    accountsB.length - accountsA.length || keyA.localeCompare(keyB));
            const representative = candidates[0]?.[1] || [];
            for (const account of representative) selected.add(account.id);
        }
    }

    let candidateAccounts = accounts.filter(account => selected.has(account.id));

    // Deduplicate roles at high-density sites with test fixtures so each role has strictly 1 employee
    for (const siteCode of DEDUPLICATE_ROLE_SITE_CODES) {
        const siteAccounts = candidateAccounts.filter(a => a.siteCode === siteCode);
        if (siteAccounts.length > 0) {
            const keptIds = deduplicateSiteRoleIds(siteAccounts);
            candidateAccounts = candidateAccounts.filter(a => a.siteCode !== siteCode || keptIds.has(a.id));
        }
    }

    return candidateAccounts;
}
