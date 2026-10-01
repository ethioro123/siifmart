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
 * Formats a site's code into a clean, human-readable display ID.
 * Returns formats like: 'KE-01', 'ET-02', 'UG-01', etc.
 */
export function formatDisplaySiteId(site?: Partial<Site> | null): string {
    if (!site) return 'N/A';
    const country = normalizeCountryCode(site.country);
    const code = site.code?.trim().toUpperCase();

    // 1. Direct match with country prefix: KE-01, ET-02
    if (code) {
        const directPattern = new RegExp(`^${country}-(\\d+)$`, 'i');
        const directMatch = code.match(directPattern);
        if (directMatch) {
            const seq = parseInt(directMatch[1], 10);
            return `${country}-${seq.toString().padStart(2, '0')}`;
        }

        // 2. Parse sequence from code (e.g. KE-ST-001, SITE-KE-0001, ST-001)
        const seq = parseSiteSequence(code, country);
        if (seq !== null) {
            return `${country}-${seq.toString().padStart(2, '0')}`;
        }
    }

    // 3. Fallback: Parse sequence from site.id if code is missing or unparsed (e.g. id: 'KE-ST-001')
    if (site.id) {
        const idSeq = parseSiteSequence(site.id, country);
        if (idSeq !== null) {
            return `${country}-${idSeq.toString().padStart(2, '0')}`;
        }
    }

    // 4. Fallback to siteNumber if present
    const siteNum = site.siteNumber || (site as any)?.site_number;
    if (siteNum) {
        return `${country}-${siteNum.toString().padStart(2, '0')}`;
    }

    // 5. Fallback: If code is already a standard 2-letter country code format
    if (code && /^[A-Z]{2}-\d+$/.test(code)) {
        return code;
    }

    return code || site.id?.substring(0, 8).toUpperCase() || `${country}-01`;
}

/**
 * Extracts the 2-letter uppercase Country ID from a site.
 */
export function getSiteCountryId(site?: Partial<Site> | null): string {
    return normalizeCountryCode(site?.country);
}
