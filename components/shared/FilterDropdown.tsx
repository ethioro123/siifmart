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
                className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
                aria-label={label}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
        </div>
    );
}
