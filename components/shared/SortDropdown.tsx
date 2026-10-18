import React from 'react';
import { ListFilter, ChevronDown } from 'lucide-react';

interface SortDropdownProps<T extends string> {
    options: { id: T; label: string; icon?: React.ReactNode }[];
    value: T;
    onChange: (val: T) => void;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    label?: string;
}

const SortDropdown = <T extends string>({
    options,
    value,
    onChange,
    isOpen,
    setIsOpen,
    label = "Sort"
}: SortDropdownProps<T>) => (
    <div className="relative">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-all whitespace-nowrap cursor-pointer shadow-xs"
        >
            <ListFilter size={14} className={value !== options[0].id ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'} />
            <span>{label}: {options.find(o => o.id === value)?.label || value}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 text-[var(--theme-text-muted)] ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <>
                <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-[var(--shadow-modal)] z-[51] animate-in fade-in slide-in-from-top-2 duration-150">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors flex items-center gap-2 rounded-xl mb-0.5 last:mb-0 cursor-pointer ${value === option.id ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs' : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
);

export default SortDropdown;
