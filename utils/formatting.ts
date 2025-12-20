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
    currency?: string;
    maxFractionDigits?: number;
    compact?: boolean;
}): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    let formattedNumber: string;

    // If NOT compact, or if the number is small (< 1000), use full precision localized string
    if (!options?.compact || (absValue < 1000)) {
        formattedNumber = absValue.toLocaleString(options?.locale || 'en-US', {
            maximumFractionDigits: options?.maxFractionDigits ?? 2,
            minimumFractionDigits: options?.maxFractionDigits !== undefined ? options.maxFractionDigits : 0
        });
    } else {
        // Define thresholds for compact mode
        const THRESHOLDS = [
            { suffix: 'T', value: 1e12 },
            { suffix: 'B', value: 1e9 },
            { suffix: 'M', value: 1e6 },
            { suffix: 'K', value: 1e3 },
        ];

        // Find the first threshold that applies
        const item = THRESHOLDS.find(t => absValue >= t.value);
        const fractionDigits = options?.maxFractionDigits ?? 1;

        if (item) {
            const divided = (absValue / item.value);
            let numValue = parseFloat(divided.toFixed(fractionDigits));

            // Edge case: overflow to next unit
            if (numValue >= 1000) {
                const nextIndex = THRESHOLDS.indexOf(item) - 1;
                if (nextIndex >= 0) {
                    const nextItem = THRESHOLDS[nextIndex];
                    const nextDivided = (absValue / nextItem.value);
                    numValue = parseFloat(nextDivided.toFixed(fractionDigits));
                    formattedNumber = `${numValue}${nextItem.suffix}`;
                } else {
                    formattedNumber = `${numValue}${item.suffix}`;
                }
            } else {
                formattedNumber = `${numValue}${item.suffix}`;
            }
        } else {
            // Fallback for extremely small or non-matching
            formattedNumber = absValue.toLocaleString(options?.locale || 'en-US', {
                maximumFractionDigits: options?.maxFractionDigits ?? 2
            });
        }
    }

    // Combine sign, currency, and value
    // User requested spacing: "ETB 1,000,000"
    if (options?.currency) {
        return `${options.currency} ${sign}${formattedNumber}`;
    }

    return `${sign}${formattedNumber}`;
};
