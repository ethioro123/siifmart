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

// Global timezone for the application
let globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const setGlobalTimezone = (tz: string) => {
    if (!tz) return;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        globalTimezone = tz;
    } catch (e) {
        console.error("Invalid timezone:", tz);
    }
};

/**
 * Pretty-format a date string or object.
 * Returns a robust, simple representation like "Today at 2:30 PM" or "Jan 12, 2024".
 */
export const formatDateTime = (date: string | Date | undefined | null, options?: {
    showTime?: boolean;
    useRelative?: boolean;
    includeYear?: boolean;
    timeZone?: string;
}): string => {
    if (!date) return 'N/A';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';

    const useTz = options?.timeZone || globalTimezone;

    // For relative checks (today/yesterday), we need to check if the date IS today in the target timezone.
    // This is tricky with pure Date objects. 
    // Simplified approach: convert both current time and target time to strings in the target timezone to compare.
    const now = new Date();

    // Helper to get date string in target TZ
    const getDateStringInTz = (dateObj: Date, tz: string) => {
        return dateObj.toLocaleDateString([], { timeZone: tz });
    };

    const isToday = getDateStringInTz(d, useTz) === getDateStringInTz(now, useTz);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = getDateStringInTz(d, useTz) === getDateStringInTz(yesterday, useTz);

    const timeStr = d.toLocaleTimeString([], {
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: useTz
    });

    if (options?.useRelative) {
        if (isToday) return `Today at ${timeStr}`;
        if (isYesterday) return `Yesterday at ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: (options?.includeYear || d.getFullYear() !== now.getFullYear()) ? 'numeric' : undefined,
        timeZone: useTz
    });

    if (options?.showTime) {
        return `${dateStr}, ${timeStr}`;
    }

    return dateStr;
};

/**
 * Returns a relative time string like "5m ago" or "Just now".
 */
export const formatRelativeTime = (date: string | Date | undefined | null): string => {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Formats a user role for display.
 * Handles specific overrides (e.g. super_admin -> CEO) and general formatting.
 */
export const formatRole = (role: string | undefined): string => {
    if (!role) return '';

    // Explicit Overrides
    if (role === 'super_admin') return 'CEO';
    if (role === 'admin') return 'System Admin';

    // General Formatting: replace underscores with spaces and capitalize words
    // e.g. "warehouse_manager" -> "Warehouse Manager"
    return role
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
};
