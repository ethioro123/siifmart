/**
 * Job ID Formatter Utility
 * Converts UUIDs to human-readable job numbers for display
 */

/**
 * Formats a job ID for display
 * If jobNumber is available, uses it directly
 * Otherwise, creates a short hash from the UUID
 */
export const formatJobId = (job: { id: string; jobNumber?: string; job_number?: string; type?: string }): string => {
    // Prefer proper job number if available
    if (job.jobNumber) return job.jobNumber;
    if (job.job_number) return job.job_number;

    // Fallback: Create a short, readable ID from UUID
    // Take last 4 chars of UUID (hex) and convert to number
    const uuid = job.id || '';
    const hexPart = uuid.replace(/-/g, '').slice(-6);
    const numericPart = parseInt(hexPart, 16) % 10000; // 4 digit number

    // Get type prefix (matching supabase.service.ts)
    const type = job.type?.toUpperCase() || 'JOB';
    const prefix = type === 'PICK' ? 'PK' :
        type === 'PACK' ? 'PA' :
            type === 'PUTAWAY' ? 'PU' :
                type === 'TRANSFER' ? 'TRF' :
                    type === 'DISPATCH' ? 'DS' : 'JB';

    return `${prefix}-${String(numericPart).padStart(4, '0')}`;
};

/**
 * Formats an order reference for display
 * Similar to job ID but for order refs
 */
export const formatOrderRef = (orderRef: string | undefined | null, fallbackId?: string): string => {
    if (orderRef && !orderRef.includes('-') && orderRef.length < 12) {
        // Already a short ID
        return orderRef;
    }

    if (orderRef) {
        // If it looks like a UUID, shorten it
        if (orderRef.length === 36 && orderRef.includes('-')) {
            return `ORD-${orderRef.slice(-6).toUpperCase()}`;
        }
        return orderRef;
    }

    // Use fallback ID
    if (fallbackId) {
        if (fallbackId.length === 36 && fallbackId.includes('-')) {
            return `ORD-${fallbackId.slice(-6).toUpperCase()}`;
        }
        return fallbackId;
    }

    return 'N/A';
};

/**
 * Formats a transfer ID for display
 */
export const formatTransferId = (transfer: { id: string; jobNumber?: string; job_number?: string }): string => {
    if (transfer.jobNumber) return transfer.jobNumber;
    if (transfer.job_number) return transfer.job_number;

    const uuid = transfer.id || '';
    const hexPart = uuid.replace(/-/g, '').slice(-6);
    const numericPart = parseInt(hexPart, 16) % 10000;

    return `TRF-${String(numericPart).padStart(4, '0')}`;
};

/**
 * Generates a simple sequential number from a UUID
 * Used when we need a numeric display
 */
export const uuidToNumber = (uuid: string): number => {
    // Take last 8 hex chars and convert to number, then mod to keep it reasonable
    const hex = uuid.replace(/-/g, '').slice(-8);
    return parseInt(hex, 16) % 1000000; // Keep it under 1 million
};
