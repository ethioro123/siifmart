// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { useTheme } from '../../hooks/useTheme';

let matches = false;
let listeners: Set<(event: MediaQueryListEvent) => void>;
const changeDevice = (dark: boolean) => act(() => {
    matches = dark;
    for (const listener of listeners) listener({ matches: dark } as MediaQueryListEvent);
});
beforeEach(() => {
    window.localStorage.clear();
    matches = false;
    listeners = new Set();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        get matches() { return matches; },
        addEventListener: (_: string, callback: (event: MediaQueryListEvent) => void) => listeners.add(callback),
        removeEventListener: (_: string, callback: (event: MediaQueryListEvent) => void) => listeners.delete(callback)
    })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('device appearance', () => {
    it('defaults to the device despite a legacy manual override and follows live changes', () => {
        localStorage.setItem('siifmart_theme', 'dark');
        const { result, unmount } = renderHook(useTheme);
        expect(result.current.themePreference).toBe('system');
        expect(result.current.theme).toBe('light');
        changeDevice(true);
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe('dark');
        changeDevice(false);
        expect(result.current.theme).toBe('light');
        unmount();
        expect(listeners.size).toBe(0);
    });
    it('preserves an explicit manual preference and can resume the current device appearance', () => {
        const { result } = renderHook(useTheme);
        act(() => result.current.setThemePreference('light'));
        changeDevice(true);
        expect(result.current.theme).toBe('light');
        act(() => result.current.setThemePreference('system'));
        expect(result.current.theme).toBe('dark');
        expect(localStorage.getItem('siifmart_theme_preference')).toBe('system');
        changeDevice(false);
        expect(result.current.theme).toBe('light');
    });
    it('restores a newly chosen manual preference after reopening', () => {
        localStorage.setItem('siifmart_theme_preference', 'dark');
        const { result } = renderHook(useTheme);
        expect(result.current.themePreference).toBe('dark');
        expect(result.current.theme).toBe('dark');
    });
    it('continues following the device when preference storage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Unavailable'); });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
        const { result } = renderHook(useTheme);
        act(() => result.current.setThemePreference('system'));
        changeDevice(true);
        expect(result.current.theme).toBe('dark');
    });
    it('uses the same preference for first paint before React starts', () => {
        matches = true;
        localStorage.setItem('siifmart_theme', 'light');
        const html = readFileSync('index.html', 'utf8');
        const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
        new Function(script)();
        expect(document.documentElement.dataset.theme).toBe('dark');
        localStorage.setItem('siifmart_theme_preference', 'light');
        new Function(script)();
        expect(document.documentElement.dataset.theme).toBe('light');
    });
});
