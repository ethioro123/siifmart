/**
 * Human-Readable Country-Scoped Site ID Generator & Formatter
 * 
 * Guarantees every site operates under a Country ID with a sequential, human-readable Site ID:
 * - Kenya: KE-01, KE-02, KE-03...
 * - Uganda: UG-01, UG-02, UG-03...
 * - Tanzania: TZ-01, TZ-02, TZ-03...
 * - Rwanda: RW-01, RW-02, RW-03...
 * - Ethiopia: ET-01, ET-02, ET-03...
 * 
 * Every country has its own sequence starting at 01 and incrementing independently.
 */

import type { Country } from './localization';
import type { Site } from '../types';

/**
 * Normalizes a country code to a standard 2-letter uppercase string.
 */
export function normalizeCountryCode(country?: string | null): string {
    if (!country) return 'ET';
    const clean = country.trim().toUpperCase();
    return clean || 'ET';
}

/**
 * Extracts the numerical sequence from a site code for a given country.
 * Supports patterns:
 * - Direct: KE-01, KE-2, ET-09 -> 1, 2, 9
 * - Prefixed: SITE-KE-0001, SITE-0001 -> 1
 * - Legacy: KE-WH001, KE-ST002 -> 1, 2
 */
export function parseSiteSequence(code?: string | null, country?: string | null): number | null {
    if (!code) return null;
    const trimmed = code.trim().toUpperCase();
    const c = normalizeCountryCode(country);

    // Exact Country-Seq pattern: KE-01, ET-02, UG-10
    const directPattern = new RegExp(`^${c}-(\\d+)$`, 'i');
    const directMatch = trimmed.match(directPattern);
    if (directMatch) {
        return parseInt(directMatch[1], 10);
    }

    // SITE-[COUNTRY]-[SEQ] pattern: SITE-KE-0001, SITE-UG-02
    const siteCountryPattern = new RegExp(`^SITE-${c}-(\\d+)$`, 'i');
    const siteCountryMatch = trimmed.match(siteCountryPattern);
    if (siteCountryMatch) {
        return parseInt(siteCountryMatch[1], 10);
    }

    // Generic [COUNTRY]-[TYPE]-[SEQ] or [COUNTRY]-[TYPE][SEQ]: KE-WH001, KE-ST-001, KE-ST002, KE-STORE-1
    const countryTypePattern = new RegExp(`^(?:SITE-)?${c}-[A-Z]+-?(\\d+)$`, 'i');
    const countryTypeMatch = trimmed.match(countryTypePattern);
    if (countryTypeMatch) {
        return parseInt(countryTypeMatch[1], 10);
    }

    // Any generic Country code with trailing digits: KE_01, KE01
    const genericPattern = new RegExp(`^${c}[-_]?(\\d+)$`, 'i');
    const genericMatch = trimmed.match(genericPattern);
    if (genericMatch) {
        return parseInt(genericMatch[1], 10);
    }

    // If country is Kenya (KE), support historic store patterns: KE-ST-001, ST-001, STORE-1
    if (c === 'KE') {
        const keHistoric = trimmed.match(/^(?:SITE-)?(?:KE-)?(?:ST|STORE|WH|DC|BRANCH)-?(\d+)$/i);
        if (keHistoric) {
            return parseInt(keHistoric[1], 10);
        }
    }

    // If country is Ethiopia, support historic legacy SITE-0001, ST-001, WH-001
    if (c === 'ET') {
        const etHistoric = trimmed.match(/^(?:SITE-)?(?:ET-)?(?:SITE|ST|WH|DC)-?(\d+)$/i);
        if (etHistoric) {
            return parseInt(etHistoric[1], 10);
        }
    }

    return null;
}

/**
 * Generates the next sequential human-readable site code for a specific country.
 * e.g. If Kenya has KE-01 and KE-02, returns 'KE-03'.
 * If Uganda has no sites, returns 'UG-01'.
 */
export function generateNextSiteCode(
    existingSites: Array<{ code?: string; country?: string }>,
    country: Country | string
): string {
    const targetCountry = normalizeCountryCode(country);

    // Filter sites belonging to target country
    const countrySites = existingSites.filter(s => {
        const siteCountry = normalizeCountryCode(s.country);
        return siteCountry === targetCountry;
    });

    let maxSeq = 0;
    for (const site of countrySites) {
        const seq = parseSiteSequence(site.code, targetCountry);
        if (seq !== null && seq > maxSeq) {
            maxSeq = seq;
        }
    }

    const nextSeq = maxSeq + 1;
    const formattedSeq = nextSeq.toString().padStart(2, '0');
    return `${targetCountry}-${formattedSeq}`;
}

/**
 * Checks if a string is a clean regional operational site code.
 * Matches: [COUNTRY]-[ZONE]-[TYPE]-[NUMBER] (e.g. ET-ADD-ADM-01, ET-DIR-WH-02, KE-NRB-STR-17)
 * Also matches legacy formats like ADD-WH-01 or ET-ADD-STR-BOLE-01 for backward compatibility.
 */
export function isPlaceSpecificCode(code?: string | null): boolean {
    if (!code) return false;
    const clean = code.trim().toUpperCase();
    if (/^[A-Z]{2}-(?:HQ|[A-Z]{3,4})$/i.test(clean)) return true;
    return /^[A-Z]{2}-[A-Z]{3,4}-[A-Z]{2,3}-\d{2,}$/.test(clean) ||
           /^[A-Z]{3,4}-[A-Z]{2,3}-\d{2,}$/.test(clean) ||
           /^[A-Z]{2}-[A-Z0-9]+-[A-Z]+-[A-Z0-9-]+$/i.test(clean);
}

/**
 * Normalizes any code into the standard clean format:
 * [COUNTRY]-[ZONE]-[TYPE]-[NUMBER] (e.g. ET-DIR-WH-02, KE-NRB-WH-12)
 * Or Sovereign Corporate HQ (ET-HQ, KE-HQ) / Regional Administration (ET-ADD, KE-NRB).
 * Completely decouples the location name from the ID.
 */
export function normalizeCleanSiteCode(code?: string | null, countryHint?: string | null): string | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();

    // 0. Direct match for Sovereign Corporate HQ (ET-HQ, KE-HQ) and Regional Administration IDs (ET-ADD, KE-NRB, ET-ADA)
    if (/^[A-Z]{2}-(?:HQ|[A-Z]{3,4})$/i.test(clean)) {
        return clean;
    }

    // 1. Direct standard match: ET-DIR-WH-02, KE-NRB-STR-17
    if (/^[A-Z]{2}-[A-Z]{3,4}-[A-Z]{2,3}-\d{2,}$/.test(clean)) {
        return clean;
    }

    // 2. Zone-Type-Number match without country prefix: ADD-WH-01 -> ET-ADD-WH-01
    const noCountryMatch = clean.match(/^([A-Z]{3,4})-([A-Z]{2,3})-(\d{2,})$/);
    if (noCountryMatch) {
        const zone = noCountryMatch[1];
        const type = noCountryMatch[2];
        const num = noCountryMatch[3];
        if (zone !== 'SITE' && !['KE', 'ET', 'UG', 'RW', 'TZ'].includes(type)) {
            const country = normalizeCountryCode(countryHint || getCountryByZoneAbbr(zone));
            return `${country}-${zone}-${type}-${num}`;
        }
    }

    // 3. Legacy hierarchical with location name slug: ET-ADD-STR-BOLE-01 or ADD-STR-BOLE-01
    const slugMatch = clean.match(/^(?:([A-Z]{2})-)?([A-Z]{3,4})-([A-Z]{2,3})-[A-Z0-9]+-(\d{2,})$/);
    if (slugMatch) {
        const country = normalizeCountryCode(slugMatch[1] || countryHint || getCountryByZoneAbbr(slugMatch[2]));
        return `${country}-${slugMatch[2]}-${slugMatch[3]}-${slugMatch[4]}`;
    }

    return null;
}

/**
 * Returns country code corresponding to standard zone abbreviation.
 */
export function getCountryByZoneAbbr(zone?: string | null): string {
    if (!zone) return 'ET';
    const z = zone.toUpperCase();
    if (['ADD', 'ADA', 'DIR', 'HAW', 'BDR'].includes(z)) return 'ET';
    if (['NRB', 'MBA'].includes(z)) return 'KE';
    if (['KGL'].includes(z)) return 'RW';
    if (['DAR'].includes(z)) return 'TZ';
    if (['KLA'].includes(z)) return 'UG';
    return 'ET';
}

/**
 * Resolves standard 3-letter regional abbreviation from region code or string.
 */
export function getRegionAbbreviation(regionCode?: string | null): string {
    if (!regionCode) return 'HQ';
    const trimmed = regionCode.trim().toUpperCase();
    // Direct standard match: ET-ADD -> ADD, KE-NRB -> NRB, or direct ADD
    const dashedMatch = trimmed.match(/^(?:[A-Z]{2}-)?([A-Z]{3,4})$/);
    if (dashedMatch) {
        return dashedMatch[1];
    }
    const clean = regionCode.toLowerCase().replace(/^(ke|et|ug|rw|tz)[_-]/, '');
    const map: Record<string, string> = {
        nairobi: 'NRB',
        nrb: 'NRB',
        mombasa: 'MBA',
        mba: 'MBA',
        addis: 'ADD',
        add: 'ADD',
        dire: 'DIR',
        dir: 'DIR',
        adama: 'ADA',
        ada: 'ADA',
        hawassa: 'HAW',
        haw: 'HAW',
        bahirdar: 'BDR',
        bdr: 'BDR',
        kigali: 'KGL',
        kgl: 'KGL',
        dar: 'DAR',
        kampala: 'KLA',
        kla: 'KLA'
    };
    return map[clean] || clean.substring(0, 3).toUpperCase();
}

/**
 * Smart resolver for regional abbreviation from site fields or location address.
 */
export function resolveRegionAbbreviation(site?: Partial<Site> | null): string {
    const reg = site?.region_code || (site as any)?.regionCode || (site as any)?.region;
    if (reg) {
        return getRegionAbbreviation(reg);
    }
    const combined = `${site?.name || ''} ${site?.address || ''}`.toLowerCase();
    if (combined.includes('nairobi') || combined.includes('eastleigh') || combined.includes('kileleshwa') || combined.includes('westlands')) return 'NRB';
    if (combined.includes('mombasa')) return 'MBA';
    if (combined.includes('addis') || combined.includes('bole') || combined.includes('merkato') || combined.includes('finfinne')) return 'ADD';
    if (combined.includes('dire') || combined.includes('harar') || combined.includes('awaday') || combined.includes('bedeno') || combined.includes('aratanya')) return 'DIR';
    if (combined.includes('adama') || combined.includes('ambo') || combined.includes('oromia') || combined.includes('nazret')) return 'ADA';
    if (combined.includes('hawassa')) return 'HAW';
    if (combined.includes('bahir') || combined.includes('bdr')) return 'BDR';
    if (combined.includes('kigali')) return 'KGL';
    if (combined.includes('dar') || combined.includes('salaam')) return 'DAR';
    if (combined.includes('kampala')) return 'KLA';

    // If national HQ or Central Operations, default to country capital region
    const country = normalizeCountryCode(site?.country);
    if (country === 'ET') return 'ADD';
    if (country === 'KE') return 'NRB';
    if (country === 'UG') return 'KLA';
    if (country === 'RW') return 'KGL';
    if (country === 'TZ') return 'DAR';
    return 'HQ';
}

/**
 * Resolves standard 2-3 letter facility tier abbreviation from facility type.
 */
export function getFacilityTypeAbbreviation(type?: string | null): string {
    if (!type) return 'LOC';
    const lower = type.toLowerCase();
    if (lower.includes('admin') || lower.includes('central') || lower.includes('hq')) return 'ADM';
    if (lower.includes('distribution') || lower === 'dc') return 'DC';
    if (lower.includes('warehouse') || lower.includes('storage') || lower.includes('hub')) return 'WH';
    if (lower.includes('dark store') || lower.includes('online')) return 'ONL';
    if (lower.includes('store') || lower.includes('retail') || lower.includes('market') || lower.includes('grocery')) return 'STR';
    return 'LOC';
}

/**
 * Resolves the next globally unique sequence number across all facilities.
 * Guarantees no two locations anywhere share the same number (e.g. 01 and 01).
 */
export function getNextUniqueSiteNumber(
    existingSites?: Array<{ code?: string; country?: string; site_number?: number; siteNumber?: number }>
): number {
    if (!existingSites || existingSites.length === 0) return 1;
    let maxSeq = 0;

    for (const site of existingSites) {
        if (!site) continue;
        const siteNum = typeof site.siteNumber === 'number'
            ? site.siteNumber
            : (typeof (site as any).site_number === 'number' ? (site as any).site_number : 0);
        if (siteNum > maxSeq) {
            maxSeq = siteNum;
        }

        if (site.code) {
            const match = site.code.trim().match(/-(\d{2,})$/);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (!isNaN(seq) && seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
    }

    return maxSeq + 1;
}

/**
 * Generates a clean operational site code:
 * [COUNTRY]-[ZONE]-[TYPE]-[UNIQUE_NUMBER]
 * e.g. ET-ADD-ADM-01, ET-DIR-WH-02, KE-NRB-WH-12
 * Completely decouples location name from ID and ensures globally unique numbers.
 */
export function generatePlaceSpecificSiteCode(params: {
    country?: Country | string;
    regionCode?: string;
    type?: string;
    name?: string;
    siteNumber?: number;
    existingSites?: Array<{ code?: string; country?: string; site_number?: number; siteNumber?: number }>;
}): string {
    const country = normalizeCountryCode(params.country);
    const region = params.regionCode
        ? getRegionAbbreviation(params.regionCode)
        : resolveRegionAbbreviation({ name: params.name, country, region_code: params.regionCode });
    const type = getFacilityTypeAbbreviation(params.type);

    // Regional Administration office is identified directly by its Region ID: [COUNTRY]-[REGION]
    if (type === 'ADM' && params.regionCode) {
        return `${country}-${region}`;
    }

    let seq = params.siteNumber;
    if (typeof seq !== 'number' || isNaN(seq) || seq <= 0) {
        seq = getNextUniqueSiteNumber(params.existingSites);
    }

    const seqStr = seq.toString().padStart(2, '0');
    return `${country}-${region}-${type}-${seqStr}`;
}

/**
 * Formats a site's code into a clean, human-readable display ID.
 * Returns clean operational IDs like ET-DIR-WH-02, KE-NRB-WH-12,
 * Sovereign Corporate HQ IDs (ET-HQ, KE-HQ), or Region IDs (ET-ADD, KE-NRB).
 */
export function formatDisplaySiteId(site?: Partial<Site> | null): string {
    if (!site) return 'N/A';
    const code = site.code?.trim().toUpperCase();

    // 0. Sovereign Corporate HQ (ET-HQ, KE-HQ) and Regional Administration codes (ET-ADD, KE-NRB, ET-ADA)
    if (code && /^[A-Z]{2}-(?:HQ|[A-Z]{3,4})$/i.test(code)) {
        return code;
    }

    // 1. HIGHEST PRIORITY: Normalized clean site code: [COUNTRY]-[ZONE]-[TYPE]-[NUMBER]
    const normalized = normalizeCleanSiteCode(code, site.country);
    if (normalized) {
        return normalized;
    }

    // 2. Synthesize clean code from site metadata
    if (site.type || site.name) {
        const country = getSiteCountryId(site);
        const region = resolveRegionAbbreviation(site);
        const type = getFacilityTypeAbbreviation(site.type);
        if (type === 'ADM' && (site.region_code || (site as any)?.regionCode)) {
            return `${country}-${region}`;
        }
        const seq = site.siteNumber || (site as any)?.site_number || parseSiteSequence(code, country) || parseSiteSequence(site.id, country) || 1;
        const seqStr = seq.toString().padStart(2, '0');
        return `${country}-${region}-${type}-${seqStr}`;
    }

    // 3. Fallback: Parse sequence from site.id or code
    const country = normalizeCountryCode(site.country);
    if (code) {
        const directPattern = new RegExp(`^${country}-(\\d+)$`, 'i');
        const directMatch = code.match(directPattern);
        if (directMatch) {
            const seq = parseInt(directMatch[1], 10);
            return `${country}-${seq.toString().padStart(2, '0')}`;
        }

        const seq = parseSiteSequence(code, country);
        if (seq !== null) {
            return `${country}-${seq.toString().padStart(2, '0')}`;
        }
    }

    if (site.id) {
        const idSeq = parseSiteSequence(site.id, country);
        if (idSeq !== null) {
            return `${country}-${idSeq.toString().padStart(2, '0')}`;
        }
    }

    const siteNum = site.siteNumber || (site as any)?.site_number;
    if (siteNum) {
        return `${country}-${siteNum.toString().padStart(2, '0')}`;
    }

    return code || site.id?.substring(0, 8).toUpperCase() || 'LOC-01';
}

/**
 * Extracts the 2-letter uppercase Country ID from a site.
 */
export function getSiteCountryId(site?: Partial<Site> | null): string {
    return normalizeCountryCode(site?.country);
}
