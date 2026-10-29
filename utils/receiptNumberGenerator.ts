/**
 * Sovereign Multi-Country POS Receipt Number & Sequence Generator
 *
 * Implements country-scoped, sequential, human-readable receipt numbers:
 * - Kenya:    KE-1000001, KE-1000002... (Format: {COUNTRY}-{SITE_NUMBER}{6_DIGIT_SEQ})
 * - Ethiopia: ET-1000001, ET-1000002... (or ET-5000001 for Site 5)
 * - Uganda:   UG-1000001...
 * - Tanzania: TZ-1000001...
 * - Rwanda:   RW-1000001...
 *
 * Invariants:
 * 1. Border Isolation: Kenya and Ethiopia receipt sequences never query, merge, or cross-bleed.
 * 2. Monotonic Continuity: Sequences increment reliably per country and site.
 * 3. Offline Resilience: Maximum sequence is computed from live loaded sales and synchronized
 *    with persistent local storage.
 * 4. Backwards-Compatibility: Correctly recognizes and parses legacy receipt formats.
 */

import type { Site, SaleRecord } from '../types';
import { normalizeCountryCode, parseSiteSequence } from './siteIdGenerator';
import { getEffectiveCountry } from './localization';

export { normalizeCountryCode };

export interface ParsedReceiptNumber {
    country: string;
    siteNumber: number | null;
    sequence: number;
    raw: string;
    isLegacy: boolean;
}

export interface GenerateReceiptNumberOptions {
    activeSite?: Site | null;
    country?: string | null;
    sales?: SaleRecord[];
}

// In-memory sequence counter cache for Node / SSR / session continuity
const memorySequenceCache = new Map<string, number>();

/**
 * Resets the in-memory sequence cache (useful for test isolation).
 */
export function resetReceiptSequenceCache(): void {
    memorySequenceCache.clear();
}

/**
 * Extracts the integer sequence number from a receipt number string, scoped to a target country.
 */
export function extractReceiptSequence(
    receiptNumber?: string | null,
    targetCountry?: string | null,
    targetSiteNumber?: number | null
): number | null {
    if (!receiptNumber) return null;
    const trimmed = receiptNumber.trim().toUpperCase();
    const c = normalizeCountryCode(targetCountry);

    // 1. Modern Country-Scoped Pattern: {COUNTRY}-{SITE_NUMBER}{6_DIGIT_SEQ} (e.g. KE-1000001, ET-5000042)
    const modernPattern = new RegExp(`^${c}-(\\d+)$`, 'i');
    const modernMatch = trimmed.match(modernPattern);
    if (modernMatch) {
        const fullDigits = modernMatch[1];
        if (targetSiteNumber !== undefined && targetSiteNumber !== null) {
            const sitePrefix = String(targetSiteNumber);
            if (fullDigits.startsWith(sitePrefix) && fullDigits.length > sitePrefix.length) {
                const seqStr = fullDigits.slice(sitePrefix.length);
                const seq = parseInt(seqStr, 10);
                if (!isNaN(seq) && seq > 0) return seq;
            }
        }
        // Fallback: parse entire digit sequence
        const seq = parseInt(fullDigits, 10);
        if (!isNaN(seq) && seq > 0) return seq;
    }

    // 2. Prefixed Transaction Pattern: TX-{COUNTRY}-{SEQ} or TX-{COUNTRY_CODE_3}-{SEQ} (e.g. TX-KE-001, TX-ETH-001)
    const txPattern = new RegExp(`^TX-(?:${c}|${c === 'ET' ? 'ETH' : c === 'KE' ? 'KEN' : c})-(\\d+)$`, 'i');
    const txMatch = trimmed.match(txPattern);
    if (txMatch) {
        const seq = parseInt(txMatch[1], 10);
        if (!isNaN(seq) && seq > 0) return seq;
    }

    // 3. Generic sequential pattern: REC-{SEQ} (e.g. REC-0001, RCP-1001)
    const recPattern = /^R(?:EC|CP)-(\d+)$/i;
    const recMatch = trimmed.match(recPattern);
    if (recMatch) {
        const seq = parseInt(recMatch[1], 10);
        if (!isNaN(seq) && seq > 0) return seq;
    }

    // 4. Legacy Ethiopian numeric sequence: {SITE}{TERMINAL}{SEQUENCE} (e.g. 113300004, 63300002)
    // Only apply if targetCountry is ET or not specified
    if (c === 'ET' && /^\d{7,10}$/.test(trimmed)) {
        // Last 5 digits are the sequence
        const seqStr = trimmed.slice(-5);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > 0) return seq;
    }

    return null;
}

/**
 * Parses a receipt number string into its constituent parts.
 */
export function parseReceiptNumber(receiptNumber?: string | null): ParsedReceiptNumber | null {
    if (!receiptNumber) return null;
    const trimmed = receiptNumber.trim().toUpperCase();

    // 1. Modern {COUNTRY}-{SITE}{SEQ} (e.g. KE-1000001)
    const modernMatch = trimmed.match(/^([A-Z]{2})-(\d+)$/);
    if (modernMatch) {
        const country = normalizeCountryCode(modernMatch[1]);
        const digits = modernMatch[2];
        const siteNum = digits.length > 6 ? parseInt(digits.slice(0, digits.length - 6), 10) : parseInt(digits.slice(0, 1), 10);
        const seq = digits.length > 6 ? parseInt(digits.slice(digits.length - 6), 10) : parseInt(digits.slice(1), 10);
        return {
            country,
            siteNumber: isNaN(siteNum) ? null : siteNum,
            sequence: isNaN(seq) ? 0 : seq,
            raw: receiptNumber,
            isLegacy: false,
        };
    }

    // 2. TX-{COUNTRY}-{SEQ}
    const txMatch = trimmed.match(/^TX-([A-Z]{2,3})-(\d+)$/);
    if (txMatch) {
        return {
            country: normalizeCountryCode(txMatch[1]),
            siteNumber: null,
            sequence: parseInt(txMatch[2], 10),
            raw: receiptNumber,
            isLegacy: true,
        };
    }

    // 3. Legacy numeric (Ethiopian)
    if (/^\d{7,10}$/.test(trimmed)) {
        const siteNum = parseInt(trimmed.slice(0, 1), 10);
        const seq = parseInt(trimmed.slice(-5), 10);
        return {
            country: 'ET',
            siteNumber: isNaN(siteNum) ? null : siteNum,
            sequence: isNaN(seq) ? 0 : seq,
            raw: receiptNumber,
            isLegacy: true,
        };
    }

    return null;
}

/**
 * Finds the highest sequence number in a collection of sales for a target country and site.
 */
export function extractMaxReceiptSequence(
    sales: SaleRecord[] = [],
    targetCountry: string,
    targetSiteNumber?: number | null
): number {
    let max = 0;
    const c = normalizeCountryCode(targetCountry);

    for (const sale of sales) {
        if (!sale.receiptNumber) continue;
        const seq = extractReceiptSequence(sale.receiptNumber, c, targetSiteNumber);
        if (seq !== null && seq > max) {
            max = seq;
        }
    }

    return max;
}

/**
 * Generates the next country-scoped sequential receipt number.
 * Ensures strict multi-country tenant isolation and monotonic sequence increment.
 */
export function generateCountryScopedReceiptNumber(options: GenerateReceiptNumberOptions = {}): string {
    const { activeSite, country, sales = [] } = options;

    const targetCountry = normalizeCountryCode(
        country || activeSite?.country || (activeSite ? getEffectiveCountry(activeSite) : 'ET')
    );

    // Resolve site number: activeSite.siteNumber -> activeSite.code -> 1
    let siteNumber = activeSite?.siteNumber;
    if (siteNumber === undefined && activeSite?.code) {
        const parsed = parseSiteSequence(activeSite.code, targetCountry);
        if (parsed !== null) siteNumber = parsed;
    }
    if (siteNumber === undefined && activeSite?.code) {
        const match = activeSite.code.match(/\d+/);
        if (match) siteNumber = parseInt(match[0], 10);
    }
    const resolvedSiteNumber = Math.max(1, siteNumber || 1);

    // 1. Calculate max sequence from in-memory sales for this country & site
    const maxSalesSeq = extractMaxReceiptSequence(sales, targetCountry, resolvedSiteNumber);

    // 2. Read persistent sequence counter (in-memory cache + localStorage fallback)
    const siteKey = activeSite?.id || String(resolvedSiteNumber);
    const storageKey = `pos_receipt_counter_${targetCountry}_${siteKey}`;
    let storedSeq = memorySequenceCache.get(storageKey) || 0;

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const val = window.localStorage.getItem(storageKey);
            if (val) {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed > 0) storedSeq = Math.max(storedSeq, parsed);
            }
        }
    } catch {
        // Storage unavailable
    }

    const nextSeq = Math.max(maxSalesSeq, storedSeq) + 1;

    // Persist updated sequence
    memorySequenceCache.set(storageKey, nextSeq);
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(storageKey, String(nextSeq));
        }
    } catch {
        // Storage unavailable
    }

    const paddedSeq = String(nextSeq).padStart(6, '0');
    return `${targetCountry}-${resolvedSiteNumber}${paddedSeq}`;
}
