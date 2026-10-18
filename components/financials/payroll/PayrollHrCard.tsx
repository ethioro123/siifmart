import React from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { PayrollRun } from '../../../types';

interface PayrollHrCardProps {
  activeRun: PayrollRun;
  isHrSigned: boolean;
  isHR: boolean;
  isCurrentUserFinanceSignatory: boolean;
  isSuperAdminOrCeo: boolean;
  hrNotesInput: string;
  setHrNotesInput: (val: string) => void;
  handleSignHR: () => void;
  isActionLoading: boolean;
}

export const PayrollHrCard: React.FC<PayrollHrCardProps> = ({
  activeRun,
  isHrSigned,
  isHR,
  isCurrentUserFinanceSignatory,
  isSuperAdminOrCeo,
  hrNotesInput,
  setHrNotesInput,
  handleSignHR,
  isActionLoading
}) => {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isHrSigned
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isHrSigned
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <UserCheck size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
              Department 1: HR Certification
            </h4>
            <p className="text-[11px] text-[var(--theme-text-secondary)]">
              Verifies employee roster, attendance, leaves, and active employment.
            </p>
          </div>
        </div>
        {isHrSigned ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <CheckCircle2 size={12} /> Certified
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Clock size={12} /> Pending HR
          </span>
        )}
      </div>

      {activeRun.regionalAttestedBy && (
        <div className="mb-3 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#0071E3] dark:text-[#2997FF] font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Regional HR Audit Attested
            </span>
            <span className="font-mono text-[var(--theme-text-secondary)] text-[10px]">
              {activeRun.regionalAttestedAt ? new Date(String(activeRun.regionalAttestedAt)).toLocaleDateString() : ''}
            </span>
          </div>
          <p className="text-[11px] text-[var(--theme-text-primary)] mt-1">
            Attested by <strong>{activeRun.regionalAttestedBy}</strong> ({activeRun.regionalAttestedByRole || 'Regional HR'})
          </p>
          {activeRun.regionalNotes && (
            <p className="text-[10px] text-[var(--theme-text-secondary)] italic mt-0.5">
              "{activeRun.regionalNotes}"
            </p>
          )}
        </div>
      )}

      {isHrSigned ? (
        <div className="mt-3 p-3 bg-[var(--theme-bg-subtle)] rounded-xl text-xs space-y-1.5 border border-[var(--theme-border)]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--theme-text-secondary)]">Signatory:</span>
            <span className="font-medium text-[var(--theme-text-primary)]">
              {activeRun.hrApprovedBy} ({activeRun.hrApprovedByRole || 'HR'})
            </span>
          </div>
          {activeRun.hrApprovedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--theme-text-secondary)]">Signed At:</span>
              <span className="font-mono text-[var(--theme-text-secondary)] tabular-nums">
                {new Date(String(activeRun.hrApprovedAt)).toLocaleString()}
              </span>
            </div>
          )}
          {activeRun.hrNotes && (
            <div className="pt-1 text-[var(--theme-text-secondary)] italic text-[11px]">
              "{activeRun.hrNotes}"
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[var(--theme-border)]">
          {isHR ? (
            isCurrentUserFinanceSignatory && !isSuperAdminOrCeo ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                Zero-Trust Notice: You already signed as Finance. A distinct HR officer must certify this department.
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={hrNotesInput}
                  onChange={e => setHrNotesInput(e.target.value)}
                  placeholder="HR verification notes (e.g. Roster & attendance audited)..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-all"
                />
                <button
                  type="button"
                  onClick={handleSignHR}
                  disabled={isActionLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={14} />}
                  Certify Roster as HR
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-[var(--theme-text-secondary)] italic">
              Awaiting certification by Country HQ HR (hr_manager, hr, or Country Managing Director).
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollHrCard;
