import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import { DateRangeOption } from '../hooks/useDateFilter';
export type { DateRangeOption };

interface DateRangeSelectorProps {
    value: DateRangeOption;
    onChange: (option: DateRangeOption) => void;
    options?: DateRangeOption[];
    align?: 'left' | 'right';
    className?: string;
}

const DEFAULT_OPTIONS: DateRangeOption[] = [
    'All Time',
    'This Month',
    'Last Month',
    'This Quarter',
    'This Year',
    'Last Year'
];

export default function DateRangeSelector({
    value,
    onChange,
    options = DEFAULT_OPTIONS,
    align = 'right',
    className = ""
}: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 transition-all cursor-pointer shadow-xs group h-9"
            >
                <Calendar size={15} className={`${isOpen ? 'text-[#0071E3] dark:text-[#2997FF]' : 'text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)]'} transition-colors`} />
                <span className="text-xs font-semibold text-[var(--theme-text-primary)] tracking-tight">{value}</span>
            </button>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 w-52 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150`}
                >
                    <div className="p-1.5 space-y-0.5 max-h-[360px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${value === option
                                    ? 'text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 dark:bg-[#2997FF]/10 font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                                    }`}
                            >
                                <span>{option}</span>
                                {value === option && <Check size={14} className="text-[#0071E3] dark:text-[#2997FF]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
