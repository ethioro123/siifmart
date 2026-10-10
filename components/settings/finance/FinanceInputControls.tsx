import React from 'react';

export const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="mb-5 pb-3 border-b border-[var(--theme-border)]">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{desc}</p>
    </div>
);

export interface InputGroupProps {
    label: string;
    value?: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    sub?: string;
    icon?: React.ElementType;
    type?: string;
    prefix?: string;
    disabled?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({
    label,
    value,
    onChange,
    placeholder,
    sub,
    icon: Icon,
    type = 'text',
    prefix,
    disabled = false,
}) => {
    const paddingLeft = prefix ? (prefix.length > 2 ? 'pl-12 pr-3.5' : 'pl-9 pr-3.5') : 'px-3.5';

    return (
        <div className="group space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-[#0071E3] dark:text-[#2997FF]" />} {label}
            </label>
            <div className="relative">
                {prefix && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] font-semibold text-xs pointer-events-none select-none">
                        {prefix}
                    </div>
                )}
                <input
                    type={type}
                    value={value ?? ''}
                    disabled={disabled}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl py-2 text-[var(--theme-text-primary)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-secondary)]/40 disabled:opacity-50 ${paddingLeft}`}
                />
                {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 ml-0.5">{sub}</p>}
            </div>
        </div>
    );
};

export interface RadioOption<T extends string = string> {
    value: T;
    label: string;
    desc?: string;
    icon?: React.ElementType;
}

export interface RadioCardProps<T extends string = string> {
    options: RadioOption<T>[];
    value: T;
    onChange: (val: T) => void;
    disabled?: boolean;
}

export function RadioCard<T extends string = string>({ options, value, onChange, disabled = false }: RadioCardProps<T>) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 ${
                        value === opt.value
                            ? 'bg-[#0071E3]/10 dark:bg-[#2997FF]/15 border-[#0071E3] dark:border-[#2997FF] text-[var(--theme-text-primary)] shadow-xs'
                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:border-[#0071E3]/40'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {opt.icon && (
                            <opt.icon
                                size={15}
                                className={value === opt.value ? 'text-[#0071E3] dark:text-[#2997FF]' : 'text-[var(--theme-text-secondary)]'}
                            />
                        )}
                        <span className="font-semibold text-xs text-[var(--theme-text-primary)]">{opt.label}</span>
                    </div>
                    {opt.desc && <p className="text-[11px] text-[var(--theme-text-secondary)] opacity-80">{opt.desc}</p>}
                </button>
            ))}
        </div>
    );
}

export interface ToggleRowProps {
    label: string;
    sub?: string;
    checked?: boolean;
    onChange: () => void;
    disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({ label, sub, checked = false, onChange, disabled = false }) => (
    <div className="flex items-start justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[#0071E3]/30 transition-colors">
        <div className="space-y-0.5 pr-2">
            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{label}</p>
            {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">{sub}</p>}
        </div>
        <button
            type="button"
            disabled={disabled}
            onClick={onChange}
            className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors relative cursor-pointer disabled:opacity-50 ${
                checked ? 'bg-[#0071E3] dark:bg-[#2997FF]' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
        >
            <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 transform ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);
