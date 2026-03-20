import React from 'react';
import { ListFilter, ChevronDown, CheckCircle } from 'lucide-react';

export const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

export const MetricBadge = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className={`flex flex-col px-4 py-2 rounded-xl border ${color} bg-opacity-10`}>
        <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
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
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-between group uppercase tracking-widest ${value === option.id
                                ? 'bg-cyber-primary text-black'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </div>
                            {value === option.id && <CheckCircle size={12} />}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
);
