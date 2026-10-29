import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const HelpBubble = ({ text }: { text: string }) => (
  <span className="group/help relative inline-block ml-1.5">
    <div className="w-3.5 h-3.5 rounded-full border border-[var(--theme-border)] flex items-center justify-center text-[9px] font-semibold text-[var(--theme-text-secondary)] cursor-help hover:border-[var(--theme-accent)] dark:hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] dark:hover:text-[var(--theme-accent)] transition-colors">
      ?
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[11px] text-[var(--theme-text-primary)] opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 z-50 shadow-md pointer-events-none">
      <div className="relative z-10 font-normal leading-relaxed">
        {text}
      </div>
    </div>
  </span>
);

export const NavButton = ({ label, icon: Icon, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 outline-none cursor-pointer text-xs font-medium ${active
      ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
      : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
    }`}
  >
    <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20 text-white' : 'text-[var(--theme-text-secondary)]'}`}>
      <Icon size={16} />
    </div>
    <span className="tracking-wide">
      {label}
    </span>
  </button>
);

export const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs ${className}`}>
    {children}
  </div>
);

export const SectionHeader = ({ title, desc, icon: Icon, compact = false }: any) => (
  <div className={`flex items-start gap-3.5 ${compact ? 'mb-4' : 'mb-6'}`}>
    <div className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 flex items-center justify-center shrink-0`}>
      <Icon size={compact ? 18 : 20} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-[var(--theme-text-primary)] tracking-tight mb-0.5`}>{title}</h3>
      <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">{desc}</p>
    </div>
  </div>
);

export const ToggleRow = ({ label, sub, checked, onChange, warning, icon: Icon, help }: any) => (
  <div
    onClick={onChange}
    className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-border)] transition-colors group/row cursor-pointer select-none"
  >
    <div className="flex items-center gap-3 pr-2 min-w-0">
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'}`}>
          <Icon size={16} />
        </div>
      )}
      <div className="space-y-0.5 min-w-0">
        <div className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center">
          {label}
          {help && <HelpBubble text={help} />}
        </div>
        {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] truncate">{sub}</p>}
        {warning && checked && (
          <p className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1 mt-0.5 font-medium">
            <AlertTriangle size={11} className="shrink-0" /> {warning}
          </p>
        )}
      </div>
    </div>
    <div
      className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors relative flex items-center ${checked ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </div>
);

export const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
      {Icon && <Icon size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />} {label}
    </label>
    <div>
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/40"
      />
      {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 ml-0.5">{sub}</p>}
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
        className={`p-4 rounded-xl border transition-colors text-left relative overflow-hidden cursor-pointer ${value === opt.value
          ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border-[var(--theme-accent)] dark:border-[var(--theme-accent)] shadow-xs'
          : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:border-[var(--theme-border)]'
        }`}
      >
        {value === opt.value && (
          <div className="absolute top-2.5 right-2.5">
            <div className="bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] w-2 h-2 rounded-full" />
          </div>
        )}
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${value === opt.value ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'}`}>
            {opt.icon && <opt.icon size={16} />}
          </div>
          <div>
            <span className="font-semibold text-xs text-[var(--theme-text-primary)]">{opt.label}</span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--theme-text-secondary)]">{opt.desc}</p>
      </button>
    ))}
  </div>
);
