/**
 * Standardized Batch & Lot Number Management System
 * 
 * Provides human-readable, deterministic, date-received anchored lot numbers.
 * Structure: LOT-YYYYMMDD-[SKU]-[SEQUENCE]
 * Example:   LOT-20261003-KEGR001-01
 * 
 * Benefits:
 * 1. Easy to understand: Date received is immediately visible to any floor worker.
 * 2. Highly organized: Naturally sorts chronologically and groups by SKU and intake split.
 * 3. Robust: Prevents collisions across items, supports supplier custom lot codes,
 *    and integrates with FEFO picking priority.
 */

export interface GenerateBatchOptions {
    date?: Date | string;
    sku?: string;
    sequence?: number;
    prefix?: string;
}

export interface ParsedBatchInfo {
    raw: string;
    isValid: boolean;
    prefix: string;
    dateReceived?: string; // YYYY-MM-DD
    formattedDate?: string; // e.g. "Oct 03, 2026"
    sku?: string;
    sequence?: number;
    isStandard: boolean;
}

export interface BatchExpiryStatus {
    status: 'fresh' | 'expiring_soon' | 'critical' | 'expired' | 'no_expiry';
    daysRemaining: number | null;
    label: string;
    badgeColor: string;
    fefoPriority: number;
}

/**
 * Clean SKU for lot number encoding: uppercase and strip hyphens/slashes/spaces.
 */
export function cleanBatchSku(sku?: string): string {
    if (!sku) return '';
    return sku.replace(/[-\s\/_]/g, '').trim().toUpperCase();
}

/**
 * Format date as compact YYYYMMDD
 */
export function formatCompactDate(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        const fallback = new Date();
        const y = fallback.getFullYear();
        const m = String(fallback.getMonth() + 1).padStart(2, '0');
        const day = String(fallback.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

/**
 * Generate a standardized, date-received anchored batch/lot number.
 * 
 * @param options.date - Date received (defaults to now)
 * @param options.sku - Product SKU (e.g. KE-GR001)
 * @param options.sequence - Split or batch sequence index (1 -> "01", 2 -> "02")
 * @param options.prefix - Prefix, defaults to "LOT"
 * 
 * @returns Standard batch number, e.g. "LOT-20261003-KEGR001-01"
 */
export function generateBatchNumber(options: GenerateBatchOptions = {}): string {
    const prefix = (options.prefix || 'LOT').trim().toUpperCase();
    const dateStr = formatCompactDate(options.date || new Date());
    const cleanSku = cleanBatchSku(options.sku);
    const seq = Math.max(1, Math.floor(options.sequence || 1));
    const seqStr = String(seq).padStart(2, '0');

    if (cleanSku) {
        return `${prefix}-${dateStr}-${cleanSku}-${seqStr}`;
    }
    return `${prefix}-${dateStr}-${seqStr}`;
}

/**
 * Parse any batch number string to extract date-received and metadata.
 */
export function parseBatchNumber(batchStr?: string): ParsedBatchInfo {
    const raw = (batchStr || '').trim();
    if (!raw) {
        return { raw: '', isValid: false, prefix: '', isStandard: false };
    }

    // Matches standard LOT-YYYYMMDD-SKU-01 or LOT-YYYYMMDD-01 or legacy BN-YYYYMMDD-XXXX
    const standardMatch = raw.match(/^(LOT|BN|BATCH)-(\d{4})(\d{2})(\d{2})(?:-([A-Z0-9]+))?(?:-(\d{1,4}))?$/i);
    if (standardMatch) {
        const [, prefix, y, m, d, part1, part2] = standardMatch;
        const isoDate = `${y}-${m}-${d}`;
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        let sku: string | undefined;
        let sequence: number | undefined;

        if (part1 && part2) {
            sku = part1;
            sequence = parseInt(part2, 10);
        } else if (part1) {
            if (/^\d+$/.test(part1)) {
                sequence = parseInt(part1, 10);
            } else {
                sku = part1;
            }
        }

        return {
            raw,
            isValid: true,
            prefix: prefix.toUpperCase(),
            dateReceived: isoDate,
            formattedDate,
            sku,
            sequence,
            isStandard: true
        };
    }

    return {
        raw,
        isValid: true,
        prefix: 'CUSTOM',
        isStandard: false
    };
}

/**
 * Human-friendly display label for a batch/lot in UI cards and lists.
 */
export function formatBatchDisplay(batchStr?: string): string {
    if (!batchStr) return 'No Lot Assigned';
    const parsed = parseBatchNumber(batchStr);

    if (parsed.isStandard && parsed.formattedDate) {
        const seqText = parsed.sequence ? ` (Lot #${parsed.sequence})` : '';
        return `Rcvd ${parsed.formattedDate}${seqText}`;
    }

    return `Lot: ${batchStr}`;
}

/**
 * Calculate expiry urgency, countdown, and FEFO priority score for a batch.
 */
export function getBatchExpiryStatus(expiryDate?: string): BatchExpiryStatus {
    if (!expiryDate) {
        return {
            status: 'no_expiry',
            daysRemaining: null,
            label: 'No Expiry Set',
            badgeColor: 'text-stone-400 bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10',
            fefoPriority: 999999
        };
    }

    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) {
        return {
            status: 'no_expiry',
            daysRemaining: null,
            label: 'Invalid Date',
            badgeColor: 'text-stone-400 bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10',
            fefoPriority: 999999
        };
    }

    const now = new Date();
    // Normalize to midnight for clean day calculation
    now.setHours(0, 0, 0, 0);
    const expNormalized = new Date(exp);
    expNormalized.setHours(0, 0, 0, 0);

    const diffMs = expNormalized.getTime() - now.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return {
            status: 'expired',
            daysRemaining,
            label: `Expired ${Math.abs(daysRemaining)}d ago`,
            badgeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
            fefoPriority: -1000 + daysRemaining
        };
    }

    if (daysRemaining <= 14) {
        return {
            status: 'critical',
            daysRemaining,
            label: `${daysRemaining}d left (Critical FEFO)`,
            badgeColor: 'text-red-700 bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/40',
            fefoPriority: daysRemaining
        };
    }

    if (daysRemaining <= 60) {
        return {
            status: 'expiring_soon',
            daysRemaining,
            label: `${daysRemaining}d left (Priority)`,
            badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
            fefoPriority: daysRemaining
        };
    }

    return {
        status: 'fresh',
        daysRemaining,
        label: `${daysRemaining}d shelf life (Fresh)`,
        badgeColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
        fefoPriority: daysRemaining
    };
}
