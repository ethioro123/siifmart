import React from 'react';
import { useStore } from '../contexts/CentralStore';
import type { ThemePreference } from '../hooks/useTheme';

export function ThemeSelector({ className = '' }: { className?: string }) {
    const { themePreference, setThemePreference } = useStore();
    return (
        <select
            aria-label="Appearance"
            value={themePreference}
            onChange={event => setThemePreference(event.target.value as ThemePreference)}
            className={`min-h-11 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-sm text-[var(--theme-text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${className}`}
        >
            <option value="system">Use device setting</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    );
}
