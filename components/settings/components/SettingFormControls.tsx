import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{title}</h3>
        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">{desc}</p>
    </div>
);

export interface RadioOption<T extends string = string> {
    value: T;
    label: string;
    desc?: string;
}

export interface RadioGroupProps<T extends string = string> {
    label?: string;
    options: RadioOption<T>[];
    value: T;
    onChange: (val: T) => void;
    icon?: React.ElementType;
}

export function RadioGroup<T extends string = string>({
    label,
    options,
    value,
    onChange,
    icon: Icon
}: RadioGroupProps<T>) {
    return (
        <div className="space-y-2.5">
            {label && (
                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
                </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`min-h-[44px] p-3.5 rounded-2xl border text-left transition-colors relative overflow-hidden group cursor-pointer ${value === opt.value
                            ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#1E3F27] dark:text-white shadow-sm'
                            : 'bg-[#FAF8F5] dark:bg-black/30 border-[#E2DCCE] dark:border-white/5 text-stone-500 dark:text-gray-400 hover:border-[#2C5E3B]/40 hover:bg-white dark:hover:bg-white/5'
                            }`}
                    >
                        <div className="relative z-10 flex flex-col h-full justify-between gap-1.5">
                            <span className={`text-xs font-black tracking-tight ${value === opt.value ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-[#1E3F27] dark:text-gray-300'}`}>
                                {opt.label}
                            </span>
                            {opt.desc && <span className="text-[11px] opacity-75 leading-tight">{opt.desc}</span>}
                        </div>
                        {value === opt.value && (
                            <div className="absolute top-2 right-2">
                                <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.5)]" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export interface SliderGroupProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    unit: string;
    icon?: React.ElementType;
    sub?: string;
}

export const SliderGroup: React.FC<SliderGroupProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    unit,
    icon: Icon,
    sub
}) => (
    <div className="group">
        <div className="flex justify-between items-end mb-2">
            <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
            </label>
            <span className="text-xs font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 px-2.5 py-0.5 rounded-lg">
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            title={label}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#2C5E3B] h-2 bg-[#E2DCCE] dark:bg-black/40 rounded-lg appearance-none cursor-pointer"
        />
        {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1.5">{sub}</p>}
    </div>
);

export interface ToggleRowProps {
    label: string;
    sub?: string;
    checked: boolean;
    onChange: () => void;
    warning?: string;
    disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
    label,
    sub,
    checked,
    onChange,
    warning,
    disabled = false
}) => (
    <div className="flex items-start justify-between p-3.5 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 transition-colors">
        <div className="space-y-0.5 pr-3">
            <p className="text-xs font-black text-[#1E3F27] dark:text-gray-200">{label}</p>
            {sub && <p className="text-[11px] text-stone-500 dark:text-gray-400">{sub}</p>}
            {warning && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 font-bold">
                    <AlertTriangle size={12} /> {warning}
                </p>
            )}
        </div>
        <button
            type="button"
            disabled={disabled}
            onClick={onChange}
            aria-label={label}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${checked ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
            >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`} />
            </div>
        </button>
    </div>
);
