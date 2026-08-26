import React from 'react';

export const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{title}</h3>
        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">{desc}</p>
    </div>
);

export const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text", prefix }: any) => {
    // Dynamic padding calculation based on prefix string length
    const paddingLeft = prefix ? (prefix.length > 2 ? 'pl-14 pr-4' : 'pl-10 pr-4') : 'px-4';

    return (
        <div className="group space-y-1.5">
            <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide block flex items-center gap-1.5">
                {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
            </label>
            <div className="relative">
                {prefix && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 font-bold text-xs pointer-events-none select-none">
                        {prefix}
                    </div>
                )}
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl py-2.5 text-[#1E3F27] dark:text-white text-xs font-bold focus:border-[#2C5E3B] outline-none transition-all placeholder:text-stone-400 ${paddingLeft}`}
                />
                {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 ml-1">{sub}</p>}
            </div>
        </div>
    );
};

export const RadioCard = ({ options, value, onChange }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt: any) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${value === opt.value
                    ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#1E3F27] dark:text-white shadow-sm'
                    : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400 hover:border-[#2C5E3B]/40'
                    }`}
            >
                <div className="flex items-center gap-2 mb-1">
                    {opt.icon && <opt.icon size={16} className={value === opt.value ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400'} />}
                    <span className="font-black text-xs">{opt.label}</span>
                </div>
                <p className="text-[10px] opacity-75">{opt.desc}</p>
            </button>
        ))}
    </div>
);

export const ToggleRow = ({ label, sub, checked, onChange }: any) => (
    <div className="flex items-start justify-between p-3.5 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 transition-colors">
        <div className="space-y-0.5 pr-2">
            <p className="text-xs font-black text-[#1E3F27] dark:text-gray-200">{label}</p>
            <p className="text-[10px] text-stone-500 dark:text-gray-400">{sub}</p>
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 shrink-0 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    </div>
);
