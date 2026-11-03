// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';

const TestComponent = () => {
    const { language, setLanguage, isOromo, getAdaptiveClass } = useLanguage();
    return (
        <div>
            <span data-testid="current-lang">{language}</span>
            <span data-testid="is-oromo">{isOromo ? 'yes' : 'no'}</span>
            <span data-testid="adaptive-class">{getAdaptiveClass('btn', 'btn-oromo-sm')}</span>
            <button data-testid="switch-or" onClick={() => setLanguage('or')}>Oromo</button>
            <button data-testid="switch-en" onClick={() => setLanguage('en')}>English</button>
        </div>
    );
};

describe('LanguageContext Oromo dynamic scaling & DOM sync', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = 'en';
        document.documentElement.removeAttribute('data-language');
        document.documentElement.classList.remove('lang-or');
        document.body.classList.remove('lang-or');
    });

    it('synchronizes HTML and body attributes when language is set to Oromo', async () => {
        const { getByTestId } = render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );

        // Switch to Oromo
        act(() => {
            getByTestId('switch-or').click();
        });

        expect(getByTestId('current-lang').textContent).toBe('or');
        expect(getByTestId('is-oromo').textContent).toBe('yes');
        expect(getByTestId('adaptive-class').textContent).toBe('btn btn-oromo-sm');

        // Verify DOM elements received the Oromo attributes
        expect(document.documentElement.lang).toBe('or');
        expect(document.documentElement.getAttribute('data-language')).toBe('or');
        expect(document.documentElement.classList.contains('lang-or')).toBe(true);
        expect(document.body.classList.contains('lang-or')).toBe(true);

        // Switch back to English
        act(() => {
            getByTestId('switch-en').click();
        });

        expect(getByTestId('current-lang').textContent).toBe('en');
        expect(getByTestId('is-oromo').textContent).toBe('no');
        expect(document.documentElement.lang).toBe('en');
        expect(document.documentElement.getAttribute('data-language')).toBe('en');
        expect(document.documentElement.classList.contains('lang-or')).toBe(false);
        expect(document.body.classList.contains('lang-or')).toBe(false);
    });
});
