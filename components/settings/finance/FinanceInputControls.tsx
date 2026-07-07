import React from 'react';

export const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

export const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text", prefix }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div className="relative">
            {prefix && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 text-white text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all placeholder:text-gray-600 ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
            />
            {sub && <p className="text-[10px] text-gray-500 mt-2 ml-1">{sub}</p>}
        </div>
    </div>
);

export const RadioCard = ({ options, value, onChange }: any) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map((opt: any) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${value === opt.value
                    ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-2 mb-1">
                    {opt.icon && <opt.icon size={16} className={value === opt.value ? 'text-cyber-primary' : 'text-gray-500'} />}
                    <span className="font-bold text-sm">{opt.label}</span>
                </div>
                <p className="text-[10px] opacity-70">{opt.desc}</p>
            </button>
        ))}
    </div>
);

export const ToggleRow = ({ label, sub, checked, onChange }: any) => (
    <div className="flex items-start justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="space-y-1">
            <p className="text-sm font-bold text-gray-200">{label}</p>
            <p className="text-[10px] text-gray-500">{sub}</p>
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 shrink-0 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-cyber-primary' : 'bg-white/10'}`}
        >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    </div>
);
