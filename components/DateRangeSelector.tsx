import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import { DateRangeOption } from '../hooks/useDateFilter';

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
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 dark:bg-[#18201B]/70 bg-white border dark:border-emerald-950/20 border-[#E2DCCE] rounded-xl hover:border-[#2C5E3B]/50 dark:hover:border-[#A9CBA2]/50 transition-all cursor-pointer dark:hover:bg-[#18201B] hover:bg-slate-50 shadow-sm group h-[42px]"
            >
                <Calendar size={16} className={`${isOpen ? 'text-[#8C6239] dark:text-[#E2C899]' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} transition-colors`} />
                <span className="text-sm font-bold text-gray-900 dark:text-[#EAE5D9] tracking-tight">{value}</span>
            </button>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 dark:bg-[#18201B] bg-white backdrop-blur-2xl border dark:border-emerald-950/20 border-[#E2DCCE] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                    <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${value === option
                                    ? 'text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:bg-[#2C5E3B]/5 dark:hover:bg-[#A9CBA2]/5 border border-transparent'
                                    }`}
                            >
                                <span>{option}</span>
                                {value === option && <Check size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
