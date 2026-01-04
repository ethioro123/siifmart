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
                className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/10 rounded-xl hover:border-cyber-primary/50 transition-all cursor-pointer hover:bg-black/60 shadow-lg group h-[42px]"
            >
                <Calendar size={16} className={`${isOpen ? 'text-cyber-accent' : 'text-cyber-primary'} transition-colors`} />
                <span className="text-sm font-bold text-white tracking-tight">{value}</span>
            </button>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 bg-cyber-dark/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200`}
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
                                    ? 'text-cyber-primary bg-cyber-primary/10 border border-cyber-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <span>{option}</span>
                                {value === option && <Check size={14} className="text-cyber-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
