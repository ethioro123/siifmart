/**
 * Format a number to a compact string representation (K, M, B, T).
 * 
 * Rules:
 * - < 1000: No abbreviation, max 2 decimals if needed (e.g. 500, 999.99)
 * - >= 1000: Abbreviate with K (e.g. 1.5K, 100K)
 * - >= 1M: Abbreviate with M (e.g. 1.5M, 100M)
 * - >= 1B: Abbreviate with B (e.g. 1.5B)
 * 
 * @param value The number to format
 * @param options Options for formatting
 * @returns Formatted string
 */
export const formatCompactNumber = (value: number | undefined | null, options?: {
    locale?: string;
    currency?: string; // If provided, prefixes with currency symbol roughly (though usually handled outside)
    maxFractionDigits?: number;
}): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    // Define thresholds
    const THRESHOLDS = [
        { suffix: 'T', value: 1e12 },
        { suffix: 'B', value: 1e9 },
        { suffix: 'M', value: 1e6 },
        { suffix: 'K', value: 1e3 },
    ];

    // Find the first threshold that applies
    const item = THRESHOLDS.find(t => absValue >= t.value);

    // Default formatting options
    const fractionDigits = options?.maxFractionDigits ?? 1;

    if (item) {
        // We found a threshold (e.g. M for 1,500,000)
        // Divide by threshold value: 1,500,000 / 1,000,000 = 1.5
        const divided = (absValue / item.value);

        // Remove trailing zeros using parseFloat cleanup
        let formatted = parseFloat(divided.toFixed(fractionDigits));

        // Edge case: 999,999 -> 1000K (rounded). Should be 1M.
        // If the number formats to "1000" and there is a larger unit, upgrade it.
        // For T (Trillion), there is no larger unit currently defined, so 1000T is fine.
        // But for K, M, B, we should check next tier.
        if (formatted >= 1000) {
            const nextIndex = THRESHOLDS.indexOf(item) - 1; // Previous item in list (larger value)
            if (nextIndex >= 0) {
                const nextItem = THRESHOLDS[nextIndex];
                const nextDivided = (absValue / nextItem.value);
                const nextFormatted = parseFloat(nextDivided.toFixed(fractionDigits));
                return `${sign}${nextFormatted}${nextItem.suffix}`;
            }
        }

        return `${sign}${formatted}${item.suffix}`;
    }

    // No abbreviation needed (< 1000)
    // For small numbers, we might want standard comma separation: 999
    // But usually for "compact" context, plain number is fine. 
    // Let's use standard locale string for clarity if it remains small but exact.
    return value.toLocaleString(options?.locale || 'en-US', {
        maximumFractionDigits: options?.maxFractionDigits ?? 2
    });
};
