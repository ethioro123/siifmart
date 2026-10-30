import React from 'react';
import { Search } from 'lucide-react';

/** Reuses search interaction without merging evidence sources or access scopes. */
export function HistorySearch({ value, onChange, label, placeholder = label }: {
    value: string; onChange: (value: string) => void; label: string; placeholder?: string;
}) {
    return <div className="relative flex-1 w-full">
        <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
        <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
    </div>;
}
