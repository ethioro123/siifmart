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
    const isOutbound = ['PICK', 'PACK', 'DISPATCH'].includes(job.type?.toUpperCase());

    // For Outbound jobs (Pick/Pack/Dispatch), extract the core ID from orderRef
    // and apply the stage-specific prefix (PK-, PA-, DP-) for tracking.
    // This ensures: TR-CARN → PK-CARN → PA-CARN → DP-CARN
    if (isOutbound && job.orderRef) {
        let cleanRef = job.orderRef.toUpperCase();

        // Strip ALL known prefixes to get the core ID
        ['TR-', 'PK-', 'PA-', 'DP-', 'DIST-', 'TRF-', 'MTR-', 'REP-', 'REPLENISH-'].forEach(prefix => {
            if (cleanRef.startsWith(prefix)) {
                cleanRef = cleanRef.replace(prefix, '');
            }
        });

        // If it's a UUID, shorten it; otherwise keep as-is
        if (isUUID(cleanRef)) {
            cleanRef = cleanRef.slice(-4).toUpperCase();
        }

        // Apply stage-specific prefix
        const type = job.type?.toUpperCase();
        const stagePrefix = type === 'PICK' ? 'PK-' :
            type === 'PACK' ? 'PA-' :
                type === 'DISPATCH' ? 'DP-' : '';

        return `${stagePrefix}${cleanRef}`;
    }
    // Otherwise, try sequential job number (Most specific to the task)
    else {
        const jn = job.jobNumber || job.job_number;
        if (jn) {
            // If it's a long string like PICK-260104-2786, take the last part for the "four digits" look
            if (jn.includes('-')) {
                const parts = jn.split('-');
                const lastPart = parts[parts.length - 1];
                if (lastPart.length >= 4 && lastPart.length <= 6) {
                    result = lastPart.toUpperCase();
                } else {
                    result = jn.toUpperCase();
                }
            } else {
                result = jn.toUpperCase();
            }
        } else {
            // Fallback: try PO number or orderRef
            const ref = job.poNumber || job.po_number || job.orderRef || job.id;
            let cleanRef = (ref || '').toUpperCase();

            // Strip prefixes for fallback too
            ['TR-', 'PK-', 'PA-', 'DP-', 'PW-', 'RP-', 'DIST-', 'TRF-', 'MTR-', 'REP-', 'REPLENISH-'].forEach(prefix => {
                if (cleanRef.startsWith(prefix)) {
                    cleanRef = cleanRef.replace(prefix, '');
                }
            });

            if (cleanRef && !isUUID(cleanRef)) {
                result = cleanRef;
            } else if (cleanRef) {
                result = cleanRef.slice(-4);
            }
        }
    }

    // Prepend type for clarity (Enforce 2-char prefix) - For non-Outbound jobs
    const type = job.type?.toUpperCase();
    const typePrefix = type === 'PICK' ? 'PK-' :
        type === 'PACK' ? 'PA-' :
            type === 'PUTAWAY' ? 'PW-' :
                type === 'DISPATCH' ? 'DP-' :
                    type === 'TRANSFER' ? 'TR-' :
                        type === 'REPLENISH' ? 'RP-' :
                            '';

    if (typePrefix && result !== 'N/A') {
        // Ensure we don't double prefix
        if (result.startsWith(typePrefix)) return result;
        return `${typePrefix}${result}`;
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

