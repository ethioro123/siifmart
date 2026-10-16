/**
 * Sovereign Multi-Country Worker & Employee ID Generator & Parser
 *
 * Implements country-prefixed, sovereign Employee IDs:
 * - Kenya:    KE-SIIF0044, KE-SIIF0001
 * - Ethiopia: ET-SIIF0020, ET-SIIF0040 (with backward compatibility for legacy SIIF-XXXX)
 * - Uganda:   UG-SIIF0100, UG-SIIF0001
 * - Tanzania: TZ-SIIF0001
 * - Rwanda:   RW-SIIF0001
 *
 * Guarantees:
 * 1. Independent sequence counters per country tenant (zero cross-border arithmetic bleed).
 * 2. Backwards-compatible parsing of legacy codes (SIIF-0044, EMP-001).
 * 3. Seamless staff PIN matching across full ID, lowercase, 4-digit numeric pad, or legacy code.
 * 4. Automatic employee login email derivation (e.g. ke-siif0044@siifmart.com).
 */

import { normalizeCountryCode } from './siteIdGenerator';

export { normalizeCountryCode };

export interface ParsedEmployeeCode {
    country: string;
    seq: number;
    raw: string;
    isLegacy: boolean;
}

export interface EmployeeContextLike {
    code?: string | null;
    id?: string | null;
    siteId?: string | null;
    site_id?: string | null;
    phone?: string | null;
    country?: string | null;
    activeCountry?: string | null;
    countryFallback?: string | null;
}

/**
 * Resolves the sovereign country tenant for an employee using:
 * 1. Explicit country or countryFallback
 * 2. Assigned workplace siteId prefix (e.g. 'KE-ADMIN', 'site-ke-1', 'KE-WH-001', 'UG-01')
 * 3. Mobile phone country calling code (+254 -> KE, +256 -> UG, +255 -> TZ, +250 -> RW, +251 -> ET)
 * 4. Active country context
 * Defaults to 'ET' (legacy Ethiopia baseline).
 */
export function resolveEmployeeCountry(ctx?: EmployeeContextLike | null): string {
    if (!ctx) return 'ET';
    if (ctx.country) return normalizeCountryCode(ctx.country);
    if (ctx.countryFallback) return normalizeCountryCode(ctx.countryFallback);

    // 1. Inspect assigned workplace siteId (e.g. 'KE-ADMIN', 'site-ke-1', 'KE-WH-001', 'UG-01', 'ET-01')
    const rawSiteId = ctx.siteId || ctx.site_id;
    if (rawSiteId) {
        const trimmed = rawSiteId.trim().toUpperCase();
        const siteMatch = trimmed.match(/^(?:SITE-)?([A-Z]{2})[-_]/i);
        if (siteMatch) {
            return normalizeCountryCode(siteMatch[1]);
        }
    }

    // 2. Inspect phone dial code (+254 -> KE, +256 -> UG, +255 -> TZ, +250 -> RW, +251 -> ET)
    if (ctx.phone) {
        const cleanPhone = ctx.phone.replace(/[\s-]/g, '');
        if (cleanPhone.startsWith('+254') || cleanPhone.startsWith('254')) return 'KE';
        if (cleanPhone.startsWith('+256') || cleanPhone.startsWith('256')) return 'UG';
        if (cleanPhone.startsWith('+255') || cleanPhone.startsWith('255')) return 'TZ';
        if (cleanPhone.startsWith('+250') || cleanPhone.startsWith('250')) return 'RW';
        if (cleanPhone.startsWith('+251') || cleanPhone.startsWith('251')) return 'ET';
    }

    if (ctx.activeCountry) return normalizeCountryCode(ctx.activeCountry);

    return 'ET';
}

/**
 * Formats a country-prefixed sovereign employee code.
 * Example: formatEmployeeCode('KE', 44) -> 'KE-SIIF0044'
 *          formatEmployeeCode('ET', 20) -> 'ET-SIIF0020'
 *          formatEmployeeCode('UG', 100) -> 'UG-SIIF0100'
 */
export function formatEmployeeCode(country: string | null | undefined, seq: number): string {
    const c = normalizeCountryCode(country);
    const safeSeq = Math.max(1, isNaN(seq) ? 1 : seq);
    return `${c}-SIIF${safeSeq.toString().padStart(4, '0')}`;
}

/**
 * Parses any employee code (sovereign or legacy) into structured metadata.
 * Supports:
 * - 'KE-SIIF0044', 'ET-SIIF0020', 'UG-SIIF0100'
 * - 'KE-SIIF-0044', 'ET-SIIF-0020'
 * - 'SIIF-0044', 'siif-0044' (resolves country via countryHint, defaulting to ET)
 * - 'EMP-001', 'emp-001' (resolves country via countryHint, defaulting to ET)
 */
export function parseEmployeeCode(code?: string | null, countryHint?: string | null): ParsedEmployeeCode | null {
    if (!code || typeof code !== 'string') return null;
    const trimmed = code.trim().toUpperCase();

    // 1. Sovereign Country-prefixed: KE-SIIF0044, ET-SIIF0020, UG-SIIF0100, KE-SIIF-0044
    const countryPrefixedMatch = trimmed.match(/^([A-Z]{2})-SIIF-?(\d+)$/i);
    if (countryPrefixedMatch) {
        return {
            country: normalizeCountryCode(countryPrefixedMatch[1]),
            seq: parseInt(countryPrefixedMatch[2], 10),
            raw: code,
            isLegacy: false
        };
    }

    // 2. Legacy SIIF format: SIIF-0044, SIIF0044, siif-0044
    const legacySiifMatch = trimmed.match(/^SIIF-?(\d+)$/i);
    if (legacySiifMatch) {
        return {
            country: countryHint ? normalizeCountryCode(countryHint) : 'ET',
            seq: parseInt(legacySiifMatch[1], 10),
            raw: code,
            isLegacy: true
        };
    }

    // 3. Legacy demo/EMP format: EMP-001, EMP-044
    const legacyEmpMatch = trimmed.match(/^EMP-?(\d+)$/i);
    if (legacyEmpMatch) {
        return {
            country: countryHint ? normalizeCountryCode(countryHint) : 'ET',
            seq: parseInt(legacyEmpMatch[1], 10),
            raw: code,
            isLegacy: true
        };
    }

    return null;
}

/**
 * Extracts sequence number strictly scoped to a target country.
 * Returns null if the code belongs to another country.
 */
export function extractEmployeeSequence(code?: string | null, targetCountry?: string | null): number | null {
    const parsed = parseEmployeeCode(code);
    if (!parsed) return null;
    if (targetCountry) {
        const normTarget = normalizeCountryCode(targetCountry);
        if (parsed.country !== normTarget) return null;
    }
    return parsed.seq;
}

/**
 * Derives official staff login email from employee code.
 * Example: 'KE-SIIF0044' -> 'KE-SIIF0044@siifmart.com'
 *          'ET-SIIF0020' -> 'ET-SIIF0020@siifmart.com'
 */
export function generateEmployeeEmail(code: string): string {
    if (!code) return '';
    const clean = code.trim().toUpperCase();
    return `${clean}@siifmart.com`;
}

/**
 * Turns a code-style login email into a PostgREST `or` filter that finds the matching employee code.
 * 'KE-SIIF0043@siifmart.com' -> matches KE-SIIF0043 (and legacy SIIF-0043 / SIIF0043)
 * 'siif-0043@siifmart.com'   -> matches any country's SIIF0043
 * Returns null when the email is not a worker-code email.
 */
export function buildCodeFilterFromLoginEmail(email?: string | null): string | null {
    if (!email) return null;
    const m = email.trim().toLowerCase().match(/^(?:([a-z]{2})-)?siif-?(\d+)(?:-[a-z0-9]+)?@siifmart\.com$/);
    if (!m) return null;
    const pad = m[2].padStart(4, '0');
    if (m[1]) {
        const cc = m[1].toUpperCase();
        return `code.ilike.${cc}-SIIF${pad},code.ilike.SIIF-${pad},code.ilike.SIIF${pad}`;
    }
    return `code.ilike.%SIIF${pad},code.ilike.%SIIF-${pad}`;
}

/**
 * Resilient PIN verification matching entered PIN against an employee's code.
 * Matches:
 * 1. Full code (case-insensitive): 'KE-SIIF0044' === 'ke-siif0044'
 * 2. 4-digit keypad PIN: '0044' matches 'KE-SIIF0044'
 * 3. Numeric sequence: '44' matches 'KE-SIIF0044'
 * 4. Legacy format: 'siif-0044' matches 'ET-SIIF0044'
 */
export function matchStaffPin(employeeCode?: string | null, enteredPin?: string | null): boolean {
    if (!employeeCode || !enteredPin) return false;
    const cleanCode = employeeCode.trim().toLowerCase();
    const cleanPin = enteredPin.trim().toLowerCase();
    if (!cleanPin) return false;

    // 1. Exact match (case-insensitive)
    if (cleanCode === cleanPin) return true;

    // 2. Parsed sequence & digit matching
    const parsed = parseEmployeeCode(employeeCode);
    if (parsed) {
        const paddedSeq = parsed.seq.toString().padStart(4, '0');
        if (cleanPin === paddedSeq) return true;
        if (cleanPin === String(parsed.seq)) return true;

        // Country + padded sequence (e.g. 'ke-0044')
        if (cleanPin === `${parsed.country.toLowerCase()}-${paddedSeq}`) return true;

        // Legacy cross-reference (e.g. entered 'siif-0044' for ET-SIIF0044 or vice versa)
        if (cleanPin === `siif-${paddedSeq}` || cleanPin === `siif${paddedSeq}`) return true;
    }

    // 3. Fallback: match last 4 digits if pin is at least 4 digits
    const codeDigits = cleanCode.replace(/\D/g, '');
    const pinDigits = cleanPin.replace(/\D/g, '');
    if (codeDigits && pinDigits && pinDigits.length >= 4 && codeDigits.endsWith(pinDigits)) {
        return true;
    }

    return false;
}

/**
 * Returns human-readable display ID, automatically harmonizing legacy codes or sovereign codes
 * to the employee's verified sovereign country location.
 *
 * Supports both:
 * 1. formatDisplayEmployeeId(employee, sites, countryFallback)
 * 2. formatDisplayEmployeeId(code, fallbackId, countryFallback)
 *
 * Examples:
 * - Musyoka Kioko (assigned to Kenya Central Operations, phone +254):
 *   formatDisplayEmployeeId(musyoka) -> 'KE-SIIF0043'
 * - Legacy code with country:
 *   formatDisplayEmployeeId('SIIF-0043', null, 'KE') -> 'KE-SIIF0043'
 * - Sovereign code:
 *   formatDisplayEmployeeId('KE-SIIF0044') -> 'KE-SIIF0044'
 */
export function formatDisplayEmployeeId(
    codeOrEmployee?: string | EmployeeContextLike | null,
    fallbackIdOrSites?: string | Array<{ id?: string; code?: string; country?: string }> | null,
    countryFallback?: string | null
): string {
    if (!codeOrEmployee) {
        if (typeof fallbackIdOrSites === 'string' && fallbackIdOrSites.trim()) {
            return `EMP-${fallbackIdOrSites.trim().substring(0, 5).toUpperCase()}`;
        }
        return 'NOT ASSIGNED';
    }

    // If an Employee object was passed
    if (typeof codeOrEmployee === 'object') {
        const emp = codeOrEmployee;
        const rawCode = emp.code;
        const rawId = emp.id;

        // Resolve site country if sites array was provided
        let siteCountry: string | undefined = undefined;
        if (Array.isArray(fallbackIdOrSites)) {
            const empSiteId = emp.siteId || emp.site_id;
            const matchedSite = fallbackIdOrSites.find(s =>
                (s.id && s.id === empSiteId) || (s.code && s.code === empSiteId)
            );
            if (matchedSite?.country) {
                siteCountry = matchedSite.country;
            }
        }

        const resolvedCountry = resolveEmployeeCountry({
            siteId: emp.siteId || emp.site_id,
            phone: emp.phone,
            country: siteCountry || emp.country,
            countryFallback,
            activeCountry: countryFallback
        });

        if (rawCode && rawCode.trim()) {
            const parsed = parseEmployeeCode(rawCode, resolvedCountry);
            if (parsed) {
                // If verified to belong to a specific sovereign country, enforce the country prefix
                return formatEmployeeCode(resolvedCountry, parsed.seq);
            }
            return rawCode.trim();
        }

        if (rawId && rawId.trim()) {
            return `EMP-${rawId.trim().substring(0, 5).toUpperCase()}`;
        }
        return 'NOT ASSIGNED';
    }

    // If code string was passed
    const code = codeOrEmployee;
    const fallbackId = typeof fallbackIdOrSites === 'string' ? fallbackIdOrSites : null;

    if (code && code.trim()) {
        const parsed = parseEmployeeCode(code, countryFallback);
        if (parsed) {
            const targetCountry = countryFallback ? normalizeCountryCode(countryFallback) : parsed.country;
            return formatEmployeeCode(targetCountry, parsed.seq);
        }
        return code.trim();
    }

    if (fallbackId && fallbackId.trim()) {
        return `EMP-${fallbackId.trim().substring(0, 5).toUpperCase()}`;
    }

    return 'NOT ASSIGNED';
}

