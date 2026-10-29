import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { PayrollRun } from '../../../types';

interface PayrollFinanceCardProps {
  activeRun: PayrollRun;
  isFinanceSigned: boolean;
  isFinance: boolean;
  isCurrentUserHrSignatory: boolean;
  isSuperAdminOrCeo: boolean;
  financeNotesInput: string;
  setFinanceNotesInput: (val: string) => void;
  handleSignFinance: () => void;
  isActionLoading: boolean;
}

export const PayrollFinanceCard: React.FC<PayrollFinanceCardProps> = ({
  activeRun,
  isFinanceSigned,
  isFinance,
  isCurrentUserHrSignatory,
  isSuperAdminOrCeo,
  financeNotesInput,
  setFinanceNotesInput,
  handleSignFinance,
  isActionLoading
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isFinanceSigned
          ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]'
          : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isFinanceSigned
                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]'
            }`}
          >
            <Building2 size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              Department 2: Finance Authorization
            </h4>
            <p className="text-[11px] text-[var(--theme-text-secondary)]">
              Authorizes bank liquidity, funds release, and statutory withholdings.
            </p>
          </div>
        </div>
        {isFinanceSigned ? (
          <span className="px-2.5 py-1 rounded-full bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <CheckCircle2 size={12} /> Authorized
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-border-focus)]/20 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Clock size={12} /> Pending Finance
          </span>
        )}
      </div>

      {isFinanceSigned ? (
        <div className="mt-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl text-xs space-y-1.5 border border-[var(--theme-border)]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--theme-text-secondary)]">Signatory:</span>
            <span className="font-medium text-[var(--theme-text-primary)]">
              {activeRun.financeApprovedBy} ({activeRun.financeApprovedByRole || 'Finance'})
            </span>
          </div>
          {activeRun.financeApprovedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--theme-text-secondary)]">Authorized At:</span>
              <span className="font-mono text-[var(--theme-text-secondary)] tabular-nums">
                {new Date(String(activeRun.financeApprovedAt)).toLocaleString()}
              </span>
            </div>
          )}
          {activeRun.financeNotes && (
            <div className="pt-1 text-[var(--theme-text-secondary)] italic text-[11px]">
              "{activeRun.financeNotes}"
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[var(--theme-border)]">
          {isFinance ? (
            isCurrentUserHrSignatory && !isSuperAdminOrCeo ? (
              <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1.5 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                Zero-Trust Notice: You already certified as HR. A distinct Finance officer must authorize this department.
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={financeNotesInput}
                  onChange={e => setFinanceNotesInput(e.target.value)}
                  placeholder="Finance authorization notes (e.g. Bank balance verified)..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-all"
                />
                <button
                  type="button"
                  onClick={handleSignFinance}
                  disabled={isActionLoading}
                  className="w-full py-2 bg-[var(--theme-accent)] hover:bg-[#0077ED] text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={14} />}
                  Authorize Funds as Finance
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-[var(--theme-text-secondary)] italic">
              Awaiting authorization by Finance Department (country_finance_director, accountant, or Country Managing Director).
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollFinanceCard;
