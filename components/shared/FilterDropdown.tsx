import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    className?: string;
}

export default function FilterDropdown({
    label,
    value,
    onChange,
    options,
    className = ''
}: FilterDropdownProps) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-card-hover)] focus:border-[var(--theme-primary)] transition-colors"
                aria-label={label}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-3 text-[var(--theme-text-muted)] pointer-events-none" />
        </div>
    );
}
