/**
 * Oromo Typography & Dynamic Text Utility
 * Provides responsive typography sizing helpers for Afaan Oromoo translations,
 * particularly on mobile and constrained layouts.
 */

import { Language } from './translations/types';

export function isOromoLanguage(language?: Language | string | null): boolean {
    return language === 'or';
}

/**
 * Returns adaptive class string when Oromo is active
 */
export function getOromoAdaptiveTextClass(
    language: string | undefined | null,
    baseClass: string = '',
    oromoClass: string = 'text-dynamic-sm'
): string {
    if (language === 'or') {
        return `${baseClass} ${oromoClass}`.trim();
    }
    return baseClass;
}

/**
 * Returns dynamic sizing class for buttons in Oromo
 */
export function getOromoButtonClass(
    language: string | undefined | null,
    baseClass: string = ''
): string {
    if (language === 'or') {
        return `${baseClass} text-xs sm:text-sm tracking-tight px-2 sm:px-3`.trim();
    }
    return baseClass;
}

/**
 * Returns dynamic sizing class for status badges and pills in Oromo
 */
export function getOromoBadgeClass(
    language: string | undefined | null,
    baseClass: string = ''
): string {
    if (language === 'or') {
        return `${baseClass} text-[10px] sm:text-xs tracking-tight px-1.5 py-0.5`.trim();
    }
    return baseClass;
}

/**
 * Returns dynamic sizing class for tabs in Oromo
 */
export function getOromoNavTabClass(
    language: string | undefined | null,
    baseClass: string = ''
): string {
    if (language === 'or') {
        return `${baseClass} text-xs sm:text-sm tracking-tight px-2 sm:px-3.5`.trim();
    }
    return baseClass;
}
