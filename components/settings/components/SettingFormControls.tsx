import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="mb-6 pb-4 border-b border-[var(--theme-border)]">
        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">{title}</h3>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{desc}</p>
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
                <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />} {label}
                </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`min-h-[44px] p-3.5 rounded-xl border text-left transition-colors relative overflow-hidden group cursor-pointer ${value === opt.value
                            ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] dark:border-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs'
                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                            }`}
                    >
                        <div className="relative z-10 flex flex-col h-full justify-between gap-1.5 pr-3">
                            <span className={`text-xs font-semibold tracking-tight ${value === opt.value ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)]' : 'text-[var(--theme-text-primary)]'}`}>
                                {opt.label}
                            </span>
                            {opt.desc && <span className="text-[11px] text-[var(--theme-text-secondary)] leading-tight">{opt.desc}</span>}
                        </div>
                        {value === opt.value && (
                            <div className="absolute top-2.5 right-2.5">
                                <div className="w-2 h-2 rounded-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]" />
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
            <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider group-hover:text-[var(--theme-text-primary)] transition-colors flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />} {label}
            </label>
            <span className="text-xs font-mono font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/20 dark:border-[var(--theme-accent)]/30 px-2.5 py-0.5 rounded-full">
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
            className="w-full accent-[var(--theme-accent)] dark:accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-border)] rounded-lg appearance-none cursor-pointer"
        />
        {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1.5">{sub}</p>}
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
    <div className="flex items-start justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-border)] transition-colors">
        <div className="space-y-0.5 pr-3">
            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{label}</p>
            {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] leading-tight">{sub}</p>}
            {warning && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle size={12} className="shrink-0" /> {warning}
                </p>
            )}
        </div>
        <button
            type="button"
            disabled={disabled}
            onClick={onChange}
            aria-label={label}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
            <div
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${checked ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'
                    }`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`} />
            </div>
        </button>
    </div>
);
