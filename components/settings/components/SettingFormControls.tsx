import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

export const RadioGroup = ({ label, options, value, onChange, icon: Icon }: any) => (
    <div className="space-y-3">
        {label && (
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                {Icon && <Icon size={14} />} {label}
            </label>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((opt: any) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${value === opt.value
                        ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5'
                        }`}
                >
                    <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                        <span className={`text-sm font-bold ${value === opt.value ? 'text-cyber-primary' : 'text-gray-300'}`}>
                            {opt.label}
                        </span>
                        {opt.desc && <span className="text-[10px] opacity-70 leading-tight">{opt.desc}</span>}
                    </div>
                    {value === opt.value && (
                        <div className="absolute top-0 right-0 p-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyber-primary shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    </div>
);

export const SliderGroup = ({ label, value, onChange, min, max, step, unit, icon: Icon, sub }: any) => (
    <div className="group">
        <div className="flex justify-between items-end mb-2">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-cyber-primary transition-colors flex items-center gap-2">
                {Icon && <Icon size={14} />} {label}
            </label>
            <span className="text-sm font-mono font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded">
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
            className="w-full accent-cyber-primary h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer"
        />
        {sub && <p className="text-[10px] text-gray-550 mt-1.5">{sub}</p>}
    </div>
);

export const ToggleRow = ({ label, sub, checked, onChange, warning }: any) => (
    <div className="flex items-start justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="space-y-1">
            <p className="text-sm font-bold text-gray-200">{label}</p>
            <p className="text-[10px] text-gray-500">{sub}</p>
            {warning && checked && (
                <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                    <AlertTriangle size={10} /> {warning}
                </p>
            )}
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-cyber-primary' : 'bg-white/10'
                }`}
        >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`} />
        </div>
    </div>
);
