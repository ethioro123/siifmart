import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const HelpBubble = ({ text }: { text: string }) => (
  <span className="group/help relative inline-block ml-2">
    <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[8px] font-black text-gray-500 cursor-help group-hover/help:border-cyber-primary group-hover/help:text-cyber-primary transition-colors">
      ?
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-black border border-white/10 rounded-2xl text-[10px] text-gray-300 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none">
      <div className="relative z-10 font-medium leading-relaxed">
        {text}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black" />
    </div>
  </span>
);

export const NavButton = ({ label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-500 relative group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cyber-primary/50 ${active
      ? 'text-cyber-primary'
      : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyber-primary rounded-r-full shadow-[0_0_10px_rgba(0,255,157,0.5)] animate-in slide-in-from-left-2 duration-700" />
    )}
    <div className={`p-2 rounded-xl transition-all duration-500 group-hover:scale-110 ${active ? 'bg-cyber-primary/10 shadow-inner' : 'bg-transparent'}`}>
      <Icon size={18} className={active ? 'text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'} />
    </div>
    <span className={`text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${active ? 'translate-x-1' : 'group-hover:translate-x-0.5'}`}>
      {label}
    </span>
  </button>
);

export const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 relative overflow-hidden group ${className}`}>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export const SectionHeader = ({ title, desc, icon: Icon, compact = false }: any) => (
  <div className={`flex items-start gap-6 ${compact ? 'mb-8' : 'mb-12'} animate-in fade-in slide-in-from-left-4 duration-1000`}>
    <div className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br from-cyber-primary/20 to-transparent flex items-center justify-center border border-cyber-primary/30 shadow-[0_0_20px_rgba(0,255,157,0.1)]`}>
      <Icon size={compact ? 24 : 28} className="text-cyber-primary animate-pulse-slow" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-white tracking-tight leading-tight mb-2 underline-offset-8 decoration-cyber-primary/30 decoration-2 underline`}>{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export const ToggleRow = ({ label, sub, checked, onChange, warning, icon: Icon, help }: any) => (
  <div
    onClick={onChange}
    className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-cyber-primary/20 hover:bg-cyber-primary/[0.02] transition-all duration-500 group/row cursor-pointer active:scale-[0.98]"
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${checked ? 'bg-cyber-primary/10 text-cyber-primary shadow-inner' : 'bg-white/5 text-gray-600 grayscale group-hover/row:grayscale-0'}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="space-y-0.5">
        <div className="text-sm font-black text-gray-200 tracking-wide uppercase flex items-center">
          {label}
          {help && <HelpBubble text={help} />}
        </div>
        <p className="text-[10px] text-gray-600 font-bold tracking-wider">{sub}</p>
        {warning && checked && (
          <p className="text-[10px] text-yellow-500/80 flex items-center gap-1 mt-1 font-bold italic animate-pulse">
            <AlertTriangle size={10} /> {warning}
          </p>
        )}
      </div>
    </div>
    <div
      className={`w-14 h-7 shrink-0 rounded-full p-1 transition-all duration-500 relative flex items-center ${checked ? 'bg-cyber-primary' : 'bg-white/10 shadow-inner'}`}
    >
      {checked && (
        <div className="absolute inset-0 bg-cyber-primary rounded-full animate-ping opacity-20" />
      )}
      <div className={`z-10 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 transform ${checked ? 'translate-x-[1.75rem]' : 'translate-x-0'}`} />
    </div>
  </div>
);

export const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text" }: any) => (
  <div className="group space-y-3">
    <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1 block group-focus-within:text-cyber-primary transition-all duration-500 flex items-center gap-2">
      {Icon && <Icon size={14} className="opacity-50 group-focus-within:opacity-100 transition-opacity" />} {label}
    </label>
    <div className="relative group/field">
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white/[0.02] border-b-2 border-white/5 rounded-t-xl px-5 py-4 text-white text-base font-medium focus:border-cyber-primary focus:bg-white/[0.05] outline-none transition-all duration-700 placeholder:text-gray-700 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.1em] shadow-inner"
      />
      <div className="absolute bottom-0 left-0 h-0.5 bg-cyber-primary w-0 group-focus-within:w-full transition-all duration-1000" />
      {sub && <p className="text-[10px] text-gray-600 font-bold mt-2 ml-1 italic group-focus-within:text-gray-400 transition-colors">{sub}</p>}
    </div>
  </div>
);

export const RadioCard = ({ options, value, onChange }: any) => (
  <div className="grid grid-cols-2 gap-4">
    {options.map((opt: any) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`p-6 rounded-3xl border transition-all duration-700 text-left relative overflow-hidden group/opt ${value === opt.value
          ? 'bg-cyber-primary/10 border-cyber-primary shadow-[0_0_30px_rgba(0,255,157,0.1)]'
          : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/[0.04]'
        }`}
      >
        {value === opt.value && (
          <div className="absolute top-0 right-0 p-2 animate-in zoom-in-50 duration-500">
            <div className="bg-cyber-primary w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,255,157,1)]" />
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${value === opt.value ? 'bg-cyber-primary/20 text-cyber-primary scale-110' : 'bg-white/5 text-gray-600 scale-100 group-hover/opt:scale-105'}`}>
            {opt.icon && <opt.icon size={20} />}
          </div>
          <div>
            <span className={`font-black text-xs uppercase tracking-[0.1em] transition-colors duration-500 ${value === opt.value ? 'text-white' : 'text-gray-500'}`}>{opt.label}</span>
            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-opacity duration-500 ${value === opt.value ? 'opacity-100 text-cyber-primary' : 'opacity-40'}`}>Selected</p>
          </div>
        </div>
        <p className="text-[10px] font-medium leading-relaxed italic opacity-60 tracking-wide">{opt.desc}</p>
      </button>
    ))}
  </div>
);
