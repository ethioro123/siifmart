// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDynamicText } from '../../hooks/useDynamicText';
import * as LanguageContextModule from '../../contexts/LanguageContext';

describe('useDynamicText hook', () => {
    it('provides dynamic text helpers matching active language', () => {
        vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
            language: 'or',
            isOromo: true,
            setLanguage: vi.fn(),
            t: (k: string) => k,
            country: 'ET',
            countryProfile: {} as any,
            isKenya: false,
            isEthiopia: true,
            availableLanguages: [],
            currency: 'ETB',
            currencySymbol: 'ETB',
            formatCurrency: () => '',
            getAdaptiveClass: (b = '', o = '') => `${b} ${o}`.trim()
        });

        const { result } = renderHook(() => useDynamicText());
        expect(result.current.isOromo).toBe(true);
        expect(result.current.language).toBe('or');
        expect(result.current.adaptiveClass('btn', 'text-xs')).toBe('btn text-xs');
        expect(result.current.buttonClass('btn')).toContain('text-xs');
        expect(result.current.badgeClass('badge')).toContain('text-[10px]');
    });

    it('returns standard classes when English is active', () => {
        vi.spyOn(LanguageContextModule, 'useLanguage').mockReturnValue({
            language: 'en',
            isOromo: false,
            setLanguage: vi.fn(),
            t: (k: string) => k,
            country: 'ET',
            countryProfile: {} as any,
            isKenya: false,
            isEthiopia: true,
            availableLanguages: [],
            currency: 'ETB',
            currencySymbol: 'ETB',
            formatCurrency: () => '',
            getAdaptiveClass: (b = '') => b
        });

        const { result } = renderHook(() => useDynamicText());
        expect(result.current.isOromo).toBe(false);
        expect(result.current.adaptiveClass('btn', 'text-xs')).toBe('btn');
        expect(result.current.buttonClass('btn')).toBe('btn');
    });
});
