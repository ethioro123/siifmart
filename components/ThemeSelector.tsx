import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import type { ThemePreference } from '../hooks/useTheme';

export function ThemeSelector({ className = '', variant = 'icon' }: { className?: string; variant?: 'select' | 'menu' | 'icon' }) {
    const { themePreference, setThemePreference, theme, toggleTheme } = useStore();

    if (variant === 'icon') {
        const isDark = (theme || themePreference === 'dark') === 'dark';
        return (
            <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-focus)] hover:bg-[var(--theme-bg-subtle)] shadow-xs transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] touch-manipulation ${className}`}
            >
                {isDark ? (
                    <Sun size={18} aria-hidden="true" className="transition-transform duration-200" />
                ) : (
                    <Moon size={18} aria-hidden="true" className="transition-transform duration-200" />
                )}
            </button>
        );
    }

    if (variant === 'menu') {
        const options = [
            { value: 'system', label: 'Device', Icon: Monitor },
            { value: 'light', label: 'Light', Icon: Sun },
            { value: 'dark', label: 'Dark', Icon: Moon }
        ] as const;
        return (
            <fieldset className={`min-w-0 px-1 py-2 ${className}`} onClick={event => event.stopPropagation()}>
                <legend className="px-1 text-xs font-semibold text-[var(--theme-text-secondary)]">Appearance</legend>
                <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-1">
                    {options.map(({ value, label, Icon }) => (
                        <button key={value} type="button" aria-pressed={themePreference === value}
                            aria-label={value === 'system' ? 'Use device setting' : `${label} mode`}
                            onClick={() => setThemePreference(value)}
                            className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${themePreference === value
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs ring-1 ring-[var(--theme-border)]'
                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card)]/50 hover:text-[var(--theme-text-primary)]'}`}>
                            <Icon size={15} aria-hidden="true" className="shrink-0" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </fieldset>
        );
    }
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
