// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeSelector } from '../../components/ThemeSelector';
import type { ThemePreference } from '../../hooks/useTheme';

const store = vi.hoisted(() => ({ themePreference: 'system' as ThemePreference, setThemePreference: vi.fn() }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => store }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('profile appearance control', () => {
    it.each(['system', 'light', 'dark'] as const)('shows the selected %s preference accessibly', preference => {
        store.themePreference = preference;
        render(<ThemeSelector variant="menu" />);
        expect(screen.getByRole('group', { name: 'Appearance' })).toBeTruthy();
        const selected = screen.getAllByRole('button').filter(button => button.getAttribute('aria-pressed') === 'true');
        expect(selected).toHaveLength(1);
        expect(selected[0].getAttribute('aria-label')).toBe(preference === 'system' ? 'Use device setting' : `${preference === 'light' ? 'Light' : 'Dark'} mode`);
    });
    it('switches each preference without closing the surrounding profile menu', () => {
        const closeMenu = vi.fn();
        render(<div onClick={closeMenu}><ThemeSelector variant="menu" /></div>);
        fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
        fireEvent.click(screen.getByRole('button', { name: 'Light mode' }));
        fireEvent.click(screen.getByRole('button', { name: 'Use device setting' }));
        expect(store.setThemePreference.mock.calls.map(([value]) => value)).toEqual(['dark', 'light', 'system']);
        expect(closeMenu).not.toHaveBeenCalled();
    });
});
