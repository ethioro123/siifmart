import React from 'react';
import { ListFilter, ChevronDown, CheckCircle } from 'lucide-react';

export const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

export const MetricBadge = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className={`flex flex-col px-4 py-2 rounded-xl border ${color} bg-opacity-10`}>
        <span className="text-[11px] uppercase font-semibold opacity-80">{label}</span>
        <span className="text-base font-mono tabular-nums font-bold">{value}</span>
    </div>
);

export const SortDropdown = <T extends string>({
    options,
    value,
    onChange,
    isOpen,
    setIsOpen,
    label = "Sort"
}: {
    options: { id: T, label: string, icon?: React.ReactNode }[],
    value: T,
    onChange: (val: T) => void,
    isOpen: boolean,
    setIsOpen: (val: boolean) => void,
    label?: string
}) => (
    <div className="relative">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors whitespace-nowrap uppercase tracking-wider min-h-[44px] touch-manipulation"
        >
            <ListFilter size={14} className={value !== options[0].id ? 'text-primary' : ''} />
            <span>{label}: {options.find(o => o.id === value)?.label.toUpperCase() || value.toUpperCase()}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <>
                <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between group uppercase tracking-wider min-h-[44px] touch-manipulation ${value === option.id
                                ? 'bg-primary text-white cursor-default shadow-sm'
                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </div>
                            {value === option.id && <CheckCircle size={14} strokeWidth={2.5} />}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
);
