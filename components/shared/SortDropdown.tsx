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
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-gray-400 hover:text-white transition-all whitespace-nowrap uppercase tracking-widest"
        >
            <ListFilter size={14} className={value !== options[0].id ? 'text-cyber-primary' : ''} />
            <span>{label}: {options.find(o => o.id === value)?.label.toUpperCase() || value.toUpperCase()}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
            <>
                <div className="fixed inset-0 z-[50]" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors flex items-center gap-2 rounded-xl mb-1 last:mb-0 ${value === option.id ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
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
