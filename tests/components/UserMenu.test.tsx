// @vitest-environment jsdom
import React, { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserMenu } from '../../components/topbar/UserMenu';

vi.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ availableLanguages: [{ code: 'en', label: 'English', nativeLabel: 'English' }] }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ settings: { country: 'ET' }, effectiveCountry: 'ET', isCeo: false }) }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ themePreference: 'system', setThemePreference: vi.fn() }) }));
afterEach(cleanup);

function setup() {
    const close = vi.fn();
    const navigate = vi.fn();
    const logout = vi.fn();
    render(<UserMenu user={{ name: 'Regional Buyer', email: 'buyer@example.test', role: 'buyer' }}
        isUserMenuOpen setIsUserMenuOpen={close} currentUserPoints={{ totalPoints: 120, rank: 2 }}
        todayJobs={[]} todayJobsTotal={0} logout={logout} navigate={navigate}
        language="en" setLanguage={vi.fn()} dropdownRef={createRef<HTMLDivElement>()} />);
    return { close, navigate, logout };
}

describe('profile dropdown navigation', () => {
    it('keeps activity secondary and exposes profile and appearance controls', () => {
        setup();
        expect(screen.getByText('buyer@example.test')).toBeTruthy();
        expect(screen.queryByText('Operating country')).toBeNull();
        expect(screen.getByText('Activity & achievements').closest('details')?.open).toBe(false);
        expect(screen.getByRole('button', { name: 'My profile' })).toBeTruthy();
        expect(screen.getByRole('group', { name: 'Appearance' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Close user menu' })).toBeTruthy();
    });
    it('closes with Escape and restores keyboard focus to the trigger', () => {
        const { close } = setup();
        fireEvent.keyDown(screen.getByRole('dialog', { name: 'User menu' }), { key: 'Escape' });
        expect(close).toHaveBeenCalledWith(false);
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'User Profile and Menu' }));
    });
    it('preserves profile navigation and sign-out actions', () => {
        const { close, navigate, logout } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'My profile' }));
        expect(navigate).toHaveBeenCalledWith('/profile');
        expect(close).toHaveBeenCalledWith(false);
        fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
        expect(logout).toHaveBeenCalledOnce();
    });
});
