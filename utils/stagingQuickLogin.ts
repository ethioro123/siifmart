import { isPrivateNetworkHost } from './privateNetworkHost';
import { SYSTEM_ROLES } from './roles';
import { isHqFacilitySite, isRegionalAdminFacilitySite } from './roleSegregation';
import { STAGING_PROJECT_REF } from '../supabase/functions/staging-quick-login/policy';

export type FacilityTierType = 'HQ' | 'Regional Administration' | 'Operation Sites';
export type StagingSiteType = 'HQ' | 'Regional Administration' | 'Store' | 'Warehouse' | 'Distribution Center';
export interface StagingQuickAccount {
    id: string; name: string; role: string; roleId: string; level: number; levelTag: string;
    code: string; email: string; country: 'ET' | 'KE' | 'GLOBAL';
    facilityTier: FacilityTierType; siteCode: string; siteName: string; siteType: StagingSiteType;
    regionCode?: string;
    regionName?: string;
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
    return (checkIsLocalhost(hostname, isDev) || ((isDev ?? Boolean(import.meta.env.DEV)) && isPrivateNetworkHost(hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname)))) && projectUrl === `https://${STAGING_PROJECT_REF}.supabase.co`;
}

export const REGION_NAMES: Record<string, string> = {
    ADD: 'Addis Ababa',
    ADA: 'Adama',
    NRB: 'Nairobi',
    MBA: 'Mombasa',
    DIR: 'Dire Dawa',
    HAW: 'Hawassa',
    BDR: 'Bahir Dar',
    KSM: 'Kisumu',
    NKR: 'Nakuru',
    ELD: 'Eldoret',
};

export function extractRegionCode(siteCode?: string | null, regionCode?: string | null): string | undefined {
    if (regionCode) {
        const clean = regionCode.toUpperCase().replace(/^(ET-|KE-)/, '').trim();
        if (clean && clean !== 'HQ') return clean;
    }
    if (siteCode) {
        const clean = siteCode.toUpperCase().replace(/^(ET-|KE-)/, '').trim();
        const first = clean.split('-')[0];
        if (['ADD', 'ADA', 'NRB', 'MBA', 'DIR', 'HAW', 'BDR', 'KSM', 'NKR', 'ELD'].includes(first)) {
            return first;
        }
    }
    return undefined;
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
    const regionCode = extractRegionCode(row.site?.code, row.site?.region_code);
    const regionName = regionCode ? REGION_NAMES[regionCode] || regionCode : undefined;

    return {
        id: row.id, name: row.name, role: role.label,
        roleId: role.id, level: role.level,
        levelTag: `L${role.level}`,
        code: row.code || '', email: row.email, country, facilityTier, siteType,
        regionCode, regionName,
        siteCode: row.site?.code || 'HQ-GLOBAL', siteName: row.site?.name || 'Global Headquarters'
    };
}

const QUICK_LOGIN_SITE_TYPES: StagingSiteType[] = [
    'HQ', 'Regional Administration', 'Store', 'Warehouse', 'Distribution Center'
];

// Ensure each active operational region has its primary store pinned so operators
// have the complete 4-tier chain (Regional Admin, Distribution Center, Warehouse, Store) in the same region.
const PINNED_QUICK_LOGIN_SITE_CODES = new Set<string>([
    'ADD-STR-03', 'ET-ADD-STR-03', // Addis Ababa (CMC Summit Supermarket)
    'ADA-STR-01', 'ET-ADA-STR-01', // Adama (Adama Central Supermarket)
    'NRB-STR-01', 'KE-NRB-STR-01', // Nairobi (Westlands Supermarket)
    'MBA-STR-01', 'KE-MBA-STR-01', // Mombasa (Nyali Cinemax Supermarket)
]);

function isPinnedQuickLoginAccount(account: StagingQuickAccount): boolean {
    return PINNED_QUICK_LOGIN_SITE_CODES.has(account.siteCode) ||
        (Boolean(account.siteName) && /cmc summit/i.test(account.siteName));
}

/** Show all regional and receiving facilities; keep pinned sites and representative HQ/stores per region. */
export function selectRepresentativeStagingAccounts(accounts: StagingQuickAccount[]): StagingQuickAccount[] {
    const selected = new Set<string>();
    const groups = new Map<string, StagingQuickAccount[]>();

    for (const account of accounts) {
        if (account.country === 'GLOBAL' || account.facilityTier === 'Regional Administration' ||
            account.siteType === 'Warehouse' || account.siteType === 'Distribution Center' ||
            isPinnedQuickLoginAccount(account)) {
            selected.add(account.id);
            continue;
        }
        if (!QUICK_LOGIN_SITE_TYPES.includes(account.siteType)) continue;
        const region = account.regionCode || 'UNKNOWN';
        const key = `${account.country}:${region}:${account.siteType}:${account.siteCode}`;
        const group = groups.get(key) || [];
        group.push(account);
        groups.set(key, group);
    }

    // Select representative unpinned stores per country and region
    const regionKeys = new Set<string>();
    for (const key of groups.keys()) {
        const parts = key.split(':');
        regionKeys.add(`${parts[0]}:${parts[1]}:${parts[2]}`);
    }

    for (const regionKey of regionKeys) {
        const candidates = [...groups.entries()]
            .filter(([key]) => key.startsWith(`${regionKey}:`))
            .sort(([keyA, accountsA], [keyB, accountsB]) =>
                accountsB.length - accountsA.length || keyA.localeCompare(keyB));
        const representative = candidates[0]?.[1] || [];
        for (const account of representative) selected.add(account.id);
    }

    return accounts.filter(account => selected.has(account.id));
}
