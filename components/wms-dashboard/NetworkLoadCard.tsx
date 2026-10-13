import React from 'react';
import { ArrowRight, Package, Cpu } from 'lucide-react';

interface NetworkLoadCardProps {
  onQuickAction: (action: 'receive' | 'cycle') => void;
  loadPercent?: number;
}

export const NetworkLoadCard: React.FC<NetworkLoadCardProps> = ({
  onQuickAction,
  loadPercent = 100
}) => {
  const statusText = loadPercent >= 80 ? 'Optimal' : loadPercent >= 50 ? 'Moderate' : 'High Load';
  const statusColor = loadPercent >= 80
    ? 'text-[#34C759] dark:text-[#30D158]'
    : loadPercent >= 50
      ? 'text-[#FF9500] dark:text-[#FF9F0A]'
      : 'text-[#FF3B30] dark:text-[#FF453A]';

  return (
    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
              <Cpu size={16} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">Network Diagnostics</h4>
              <p className="text-[11px] text-[var(--theme-text-secondary)]">Edge sync & capacity load</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] dark:text-[#30D158] border border-[#34C759]/20">
            Active
          </span>
        </div>

        <div className="relative h-32 w-full flex items-center justify-center my-2">
          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full border-4 border-[var(--theme-border)]" />
          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full border-4 border-[#0071E3] dark:border-[#2997FF] border-t-transparent border-r-transparent -rotate-45" />
          <div className="text-center relative z-10">
            <span className="block text-2xl font-bold font-mono text-[var(--theme-text-primary)] leading-none">
              {loadPercent}%
            </span>
            <span className={`text-[11px] font-semibold ${statusColor} mt-1 block`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-6 pt-4 border-t border-[var(--theme-border)]">
        <button
          type="button"
          onClick={() => onQuickAction('receive')}
          className="w-full h-10 flex items-center justify-between px-3.5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <span>Launch Receive</span>
          <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => onQuickAction('cycle')}
          className="w-full h-10 flex items-center justify-between px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <span>Audit Systems</span>
          <Package size={14} className="text-[var(--theme-text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

export default NetworkLoadCard;
