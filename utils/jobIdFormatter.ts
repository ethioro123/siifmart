/**
 * Job ID Formatter Utility
 * Converts UUIDs to human-readable job numbers for display
 */

/**
 * Generates a simple sequential number from a UUID
 * Used when we need a numeric display
 */
export const uuidToNumber = (uuid: string): number => {
    // Take last 8 hex chars and convert to number, then mod to keep it reasonable
    const hex = uuid.replace(/-/g, '').slice(-8);
    return parseInt(hex, 16) % 1000000; // Keep it under 1 million
};

/**
 * Formats a job ID for display
 * If jobNumber is available, uses it directly
 * Otherwise, creates a short hash from the UUID
 */
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

export const formatJobId = (job: any): string => {
    let result = 'N/A';

    // 1. If we have a stored job number (e.g., inherited from parent), use it first
    const jn = job.jobNumber || job.job_number;
    if (jn) {
        let cleanJn = jn.toUpperCase();
        // If it's a long string with dashes, take the last part (legacy support)
        if (cleanJn.includes('-')) {
            const parts = cleanJn.split('-');
            const lastPart = parts[parts.length - 1];
            if (lastPart.length >= 4 && lastPart.length <= 8) {
                return lastPart;
            }
        }
        return cleanJn;
    }

    const isOutbound = ['PICK', 'PACK', 'DISPATCH'].includes(job.type?.toUpperCase());

    // 2. Fallback for Outbound jobs: extract from orderRef (parent UUID)
    if (isOutbound && job.orderRef) {
        let cleanRef = job.orderRef.toUpperCase();

        // Strip ALL known prefixes to get the core ID
        ['TR-', 'PK-', 'PA-', 'DP-', 'PICK-', 'PACK-', 'DIST-', 'TRF-', 'MTR-', 'REP-', 'REPLENISH-'].forEach(prefix => {
            if (cleanRef.startsWith(prefix)) {
                cleanRef = cleanRef.replace(prefix, '');
            }
        });

        // If it's a UUID, shorten to last 6 chars; otherwise keep as-is
        if (isUUID(cleanRef)) {
            cleanRef = cleanRef.slice(-6).toUpperCase();
        }

        return cleanRef;
    }

    // 3. Last resort fallback to orderRef/ID
    const ref = job.poNumber || job.po_number || job.orderRef || job.id;
    let cleanRef = (ref || '').toUpperCase();

    // Strip prefixes for fallback too
    ['TR-', 'PK-', 'PA-', 'DP-', 'PW-', 'RP-', 'PICK-', 'PACK-', 'DIST-', 'TRF-', 'MTR-', 'REP-', 'REPLENISH-'].forEach(prefix => {
        if (cleanRef.startsWith(prefix)) {
            cleanRef = cleanRef.replace(prefix, '');
        }
    });

    if (cleanRef && !isUUID(cleanRef)) {
        result = cleanRef;
    } else if (cleanRef) {
        result = cleanRef.slice(-6);
    }

    return result;
};

/**
 * Formats a PO Number for display
 * Prioritizes AAAA0000 format, returns N/A if missing
 */
export const formatPONumber = (po: { po_number?: string; poNumber?: string; id?: string }): string => {
    const num = po.po_number || po.poNumber;
    if (num) return num.toUpperCase();
    return 'N/A';
};

/**
 * Formats an order reference for display
 * Shortens UUIDs to 4-character uppercase IDs
 */
export const formatOrderRef = (orderRef: string | undefined | null, fallbackId?: string): string => {
    const idToProcess = (orderRef || fallbackId || '').trim();
    if (!idToProcess) return 'N/A';

    // If it looks like a UUID, shorten it to first 4 chars uppercase
    if (idToProcess.length > 8 && idToProcess.includes('-')) {
        return idToProcess.split('-')[0].slice(0, 4).toUpperCase();
    }

    // Already short or not a UUID, return as-is (max 8 chars)
    return idToProcess.slice(0, 8).toUpperCase();
};


/**
 * Formats a transfer ID for display
 */
export const formatTransferId = (transfer: { id: string; jobNumber?: string; job_number?: string }): string => {
    const jn = transfer.jobNumber || transfer.job_number;
    if (jn) return jn;
    return 'N/A';
};

/**
 * Formats a shift ID for human display (e.g. SHF-0001, SHF-0042)
 * Eliminates raw UUID hex slices (e.g. SHF-7BE9746E)
 */
export const formatShiftId = (shift?: { id?: string; shiftNumber?: string | number; shift_number?: string | number } | string | null): string => {
    if (!shift) return 'N/A';

    // Prioritize explicit human-readable shiftNumber / shift_number
    const explicitNum = typeof shift === 'object' ? (shift.shiftNumber || shift.shift_number) : undefined;
    const rawId = explicitNum !== undefined && explicitNum !== null && explicitNum !== '' 
        ? explicitNum 
        : (typeof shift === 'string' ? shift : shift.id);

    if (!rawId) return 'N/A';

    const clean = String(rawId).trim();

    // Pure digits: e.g. 1 -> SHF-0001
    if (/^\d+$/.test(clean)) return `SHF-${clean.padStart(4, '0')}`;

    // Clean sequential code: e.g. SHF-0001, SHF-0042
    if (/^SHF-\d+$/i.test(clean)) return clean.toUpperCase();

    // Check if clean or rawId is a UUID or hex hash (e.g. 7be9746e-e6bf-4e58-bd89-2df39617b9e5)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(clean);
    if (isUuid) {
        if (explicitNum && /^\d+$/.test(String(explicitNum))) {
            return `SHF-${String(explicitNum).padStart(4, '0')}`;
        }
        return 'SHF-0001';
    }

    // Check if it has legacy raw hex slice after SHF- (e.g. SHF-7BE9746E)
    if (clean.toUpperCase().startsWith('SHF-')) {
        const afterPrefix = clean.slice(4);
        if (/^[0-9a-f]{8}$/i.test(afterPrefix) && !/^\d{4,}$/.test(afterPrefix)) {
            return 'SHF-0001';
        }
        return clean.toUpperCase();
    }

    return `SHF-${clean.slice(0, 4).toUpperCase()}`;
};

/**
 * Sequential PO Generator (AAAA0000 -> ZZZZ9999)
 * Transitions from old formats and ensures sequential progression
 */
// Helper to extract numeric part from PO-XXXXX
const extractPONumber = (poStr: string): number => {
    const match = poStr.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
};

/**
 * Sequential PO Generator (AAAA0000 -> ZZZZ9999)
 * Transitions from old formats and ensures sequential progression
 */
export const generateNextPONumber = (lastPO?: string): string => {
    if (!lastPO) return 'AAAA0000';

    // Try to match the new format AAAA0000 (Case insensitive for parsing)
    const match = lastPO.match(/^([A-Z]{4})(\d{4})$/i);

    if (!match) {
        // If the last PO was in the old format (e.g. PO-1234), we start fresh with the new format
        return 'AAAA0000';
    }

    let alpha = match[1].toUpperCase();
    let numeric = parseInt(match[2], 10);

    // Increment numeric part
    numeric++;

    // Overflow check for numeric part
    if (numeric > 9999) {
        numeric = 0;
        // Increment alphabet part (base-26 logic)
        alpha = incrementAlpha(alpha);
    }

    // Pad numeric part with leading zeros
    return `${alpha}${String(numeric).padStart(4, '0')}`;
};

/**
 * Helper to increment the alphabetical part of the PO number (Legacy support)
 */
const incrementAlpha = (alpha: string): string => {
    // ... preserved for legacy if needed, but unused by new generator
    const chars = alpha.split('');
    for (let i = chars.length - 1; i >= 0; i--) {
        if (chars[i] === 'Z') {
            chars[i] = 'A';
            if (i === 0) return 'AAAA';
        } else {
            chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
            break;
        }
    }
    return chars.join('');
};

/**
 * Generates a unique tracking number - 10 random digits
 * Format: 0000000000 (10 digits)
 */
export const generateTrackingNumber = (): string => {
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
};

/**
 * Formats a stock movement reason for human display.
 * Eliminates raw UUIDs (e.g. "Putaway job 621f1556-fd41-480e-af91-bce812a70ae9 line 0 to A-01-01")
 * and converts technical 0-indexed line numbers to human 1-indexed lines.
 */
export const formatMovementReason = (
    reason: string | undefined | null,
    context?: {
        orders?: Array<{ id: string; poNumber?: string; po_number?: string }>;
        jobs?: Array<{ id: string; jobNumber?: string; job_number?: string }>;
    }
): string => {
    if (!reason || !reason.trim()) return 'Receipt recorded';

    let formatted = reason.trim();

    // 1. Putaway job pattern: "Putaway job <ref> line <idx> to <location>"
    const putawayMatch = formatted.match(/^Putaway\s+job\s+([0-9a-zA-Z-]+)\s+(?:line\s+(\d+)\s+)?to\s+(.+)$/i);
    if (putawayMatch) {
        const [, rawRef, lineIdx, location] = putawayMatch;
        let jobLabel = rawRef;
        const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawRef);

        if (context?.jobs) {
            const j = context.jobs.find(job =>
                job.id.toLowerCase() === rawRef.toLowerCase() ||
                job.id.toLowerCase().startsWith(rawRef.toLowerCase()) ||
                (job.jobNumber && job.jobNumber.toLowerCase() === rawRef.toLowerCase()) ||
                (job.job_number && job.job_number.toLowerCase() === rawRef.toLowerCase())
            );
            const jn = j?.jobNumber || j?.job_number;
            if (jn) jobLabel = jn.toUpperCase();
            else if (isFullUuid) jobLabel = rawRef.slice(0, 6).toUpperCase();
        } else if (context?.orders) {
            const o = context.orders.find(po =>
                po.id.toLowerCase() === rawRef.toLowerCase() ||
                po.id.toLowerCase().startsWith(rawRef.toLowerCase()) ||
                (po.poNumber && po.poNumber.toLowerCase() === rawRef.toLowerCase()) ||
                (po.po_number && po.po_number.toLowerCase() === rawRef.toLowerCase())
            );
            const pn = o?.poNumber || o?.po_number;
            if (pn) jobLabel = pn.toUpperCase();
            else if (isFullUuid) jobLabel = rawRef.slice(0, 6).toUpperCase();
        } else if (isFullUuid) {
            jobLabel = rawRef.slice(0, 6).toUpperCase();
        }

        const lineNum = lineIdx !== undefined ? (Number(lineIdx) === 0 ? 1 : Number(lineIdx)) : undefined;
        const linePart = lineNum !== undefined ? ` line ${lineNum}` : '';
        return `Putaway job ${jobLabel}${linePart} to ${location}`;
    }

    // 2. Pick job pattern: "Pick job <ref> line <idx>"
    const pickMatch = formatted.match(/^Pick\s+job\s+([0-9a-zA-Z-]+)\s+(?:line\s+(\d+))?$/i);
    if (pickMatch) {
        const [, rawRef, lineIdx] = pickMatch;
        let jobLabel = rawRef;
        const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawRef);

        if (context?.jobs) {
            const j = context.jobs.find(job =>
                job.id.toLowerCase() === rawRef.toLowerCase() ||
                job.id.toLowerCase().startsWith(rawRef.toLowerCase()) ||
                (job.jobNumber && job.jobNumber.toLowerCase() === rawRef.toLowerCase()) ||
                (job.job_number && job.job_number.toLowerCase() === rawRef.toLowerCase())
            );
            const jn = j?.jobNumber || j?.job_number;
            if (jn) jobLabel = jn.toUpperCase();
            else if (isFullUuid) jobLabel = rawRef.slice(0, 6).toUpperCase();
        } else if (isFullUuid) {
            jobLabel = rawRef.slice(0, 6).toUpperCase();
        }

        const lineNum = lineIdx !== undefined ? (Number(lineIdx) === 0 ? 1 : Number(lineIdx)) : undefined;
        const linePart = lineNum !== undefined ? ` line ${lineNum}` : '';
        return `Pick job ${jobLabel}${linePart}`;
    }

    // 3. POS Sale Receipt pattern: "POS Sale — Receipt POS-<uuid>"
    formatted = formatted.replace(
        /Receipt\s+(?:POS-)?([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        (_, prefix) => `Receipt POS-${prefix.slice(0, 6).toUpperCase()}`
    );

    // 4. Any general UUID in the string -> replace with clean 6-character uppercase prefix or context label
    formatted = formatted.replace(
        /([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        (fullMatch, prefix) => {
            if (context?.orders) {
                const po = context.orders.find(o => o.id.toLowerCase() === fullMatch.toLowerCase());
                const num = po?.poNumber || po?.po_number;
                if (num) return num.toUpperCase();
            }
            if (context?.jobs) {
                const j = context.jobs.find(job => job.id.toLowerCase() === fullMatch.toLowerCase());
                const num = j?.jobNumber || j?.job_number;
                if (num) return num.toUpperCase();
            }
            return prefix.slice(0, 6).toUpperCase();
        }
    );

    // 5. Convert technical "line 0" to human "line 1"
    formatted = formatted.replace(/\bline\s+0\b/gi, 'line 1');

    return formatted;
};


