/**
 * HTML Entity Escaping Utility for Thermal & Document Print Templates
 * Prevents markup injection and formatting breaks from special characters (&, <, >, ", ')
 */
export const escapeHtml = (text: string | number | null | undefined): string => {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
