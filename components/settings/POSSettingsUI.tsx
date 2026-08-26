import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const HelpBubble = ({ text }: { text: string }) => (
  <span className="group/help relative inline-block ml-2">
    <div className="w-4 h-4 rounded-full border border-stone-400 dark:border-gray-600 flex items-center justify-center text-[8px] font-black text-stone-500 dark:text-gray-400 cursor-help group-hover/help:border-[#2C5E3B] group-hover/help:text-[#2C5E3B] dark:group-hover/help:text-[#A9CBA2] transition-colors">
      ?
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 p-3 bg-stone-900 dark:bg-black border border-stone-700 dark:border-white/10 rounded-2xl text-[11px] text-stone-200 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none">
      <div className="relative z-10 font-medium leading-relaxed">
        {text}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-900 dark:border-t-black" />
    </div>
  </span>
);

export const NavButton = ({ label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-300 relative group overflow-hidden outline-none cursor-pointer rounded-2xl ${active
      ? 'bg-[#2C5E3B] text-white shadow-md'
      : 'text-stone-600 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
    }`}
  >
    <div className={`p-2 rounded-xl transition-transform duration-300 ${active ? 'bg-white/20' : 'bg-stone-200/50 dark:bg-white/5'}`}>
      <Icon size={18} className={active ? 'text-white' : 'text-stone-600 dark:text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]'} />
    </div>
    <span className="text-[11px] font-black tracking-[0.15em] uppercase">
      {label}
    </span>
  </button>
);

export const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)] transition-all duration-300 ${className}`}>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export const SectionHeader = ({ title, desc, icon: Icon, compact = false }: any) => (
  <div className={`flex items-start gap-4 ${compact ? 'mb-6' : 'mb-8'} animate-in fade-in slide-in-from-left-4`}>
    <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30 shrink-0`}>
      <Icon size={compact ? 20 : 24} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight leading-tight mb-1`}>{title}</h3>
      <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] leading-relaxed">{desc}</p>
    </div>
  </div>
);

export const ToggleRow = ({ label, sub, checked, onChange, warning, icon: Icon, help }: any) => (
  <div
    onClick={onChange}
    className="flex items-center justify-between p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 transition-all duration-300 group/row cursor-pointer active:scale-[0.98]"
  >
    <div className="flex items-center gap-3.5 pr-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${checked ? 'bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-stone-200/50 dark:bg-white/5 text-stone-400 dark:text-gray-500'}`}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="space-y-0.5">
        <div className="text-xs font-black text-[#1E3F27] dark:text-white uppercase flex items-center">
          {label}
          {help && <HelpBubble text={help} />}
        </div>
        <p className="text-[11px] text-stone-500 dark:text-gray-400">{sub}</p>
        {warning && checked && (
          <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5 font-bold">
            <AlertTriangle size={10} /> {warning}
          </p>
        )}
      </div>
    </div>
    <div
      className={`w-11 h-6 shrink-0 rounded-full p-1 transition-all relative flex items-center ${checked ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </div>
);

export const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text" }: any) => (
  <div className="group space-y-2">
    <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-[#1E3F27] dark:text-white font-medium focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-gray-600"
      />
      {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1.5 ml-1">{sub}</p>}
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
        className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden cursor-pointer ${value === opt.value
          ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 border-[#2C5E3B] dark:border-[#A9CBA2] shadow-sm'
          : 'bg-[#FAF8F5] dark:bg-black/20 border-[#E2DCCE] dark:border-white/5 text-stone-500 dark:text-gray-400 hover:border-[#2C5E3B]/40'
        }`}
      >
        {value === opt.value && (
          <div className="absolute top-2.5 right-2.5">
            <div className="bg-[#2C5E3B] dark:bg-[#A9CBA2] w-2 h-2 rounded-full shadow-[0_0_8px_rgba(44,94,59,0.6)]" />
          </div>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${value === opt.value ? 'bg-[#2C5E3B] text-white' : 'bg-stone-200/60 dark:bg-white/5 text-stone-500'}`}>
            {opt.icon && <opt.icon size={18} />}
          </div>
          <div>
            <span className={`font-black text-xs uppercase tracking-wider ${value === opt.value ? 'text-[#1E3F27] dark:text-white' : 'text-stone-600 dark:text-gray-400'}`}>{opt.label}</span>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${value === opt.value ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'opacity-40'}`}>Selected</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-500 dark:text-gray-400">{opt.desc}</p>
      </button>
    ))}
  </div>
);
