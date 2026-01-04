/**
 * Job ID Formatter Utility
 * Converts UUIDs to human-readable job numbers for display
 */

/**
 * Formats a job ID for display
 * If jobNumber is available, uses it directly
 * Otherwise, creates a short hash from the UUID
 */
export const formatJobId = (job: { id: string; jobNumber?: string; job_number?: string; type?: string; orderRef?: string }): string => {
    // Prefer proper job number if available
    if (job.jobNumber) return job.jobNumber;
    if (job.job_number) return job.job_number;

    // For DISPATCH jobs, if orderRef is available and formatted (has ORD), we can use it or prefix it
    // But usually we want a consistent DS-XXXXXX format
    const uuid = job.id || '';
    const numericPart = uuidToNumber(uuid);

    // Get type prefix (matching supabase.service.ts)
    const type = job.type?.toUpperCase() || 'JOB';
    const prefix = type === 'PICK' ? 'PK' :
        type === 'PACK' ? 'PA' :
            type === 'PUTAWAY' ? 'PU' :
                type === 'TRANSFER' ? 'TRF' :
                    type === 'DISPATCH' ? 'DS' : 'JB';

    return `${prefix}-${String(numericPart).padStart(6, '0')}`;
};

/**
 * Formats an order reference for display
 * Similar to job ID but for order refs
 */
export const formatOrderRef = (orderRef: string | undefined | null, fallbackId?: string): string => {
    const idToProcess = (orderRef || fallbackId || '').trim();
    if (!idToProcess) return 'N/A';

    // If it's already a short numeric code (e.g. from manual entry)
    if (idToProcess.startsWith('ORD-') && idToProcess.length <= 10 && /^\d+$/.test(idToProcess.slice(4))) {
        return idToProcess;
    }

    // Convert UUID/Hex to a consistent 6-digit number
    const numericPart = uuidToNumber(idToProcess);
    return `ORD-${String(numericPart).padStart(6, '0')}`;
};

/**
 * Formats a transfer ID for display
 */
export const formatTransferId = (transfer: { id: string; jobNumber?: string; job_number?: string }): string => {
    if (transfer.jobNumber) return transfer.jobNumber;
    if (transfer.job_number) return transfer.job_number;

    const uuid = transfer.id || '';
    const numericPart = uuidToNumber(uuid);

    return `TRF-${String(numericPart).padStart(6, '0')}`;
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
