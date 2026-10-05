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
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-blue-50/50 dark:bg-stone-900/60 border-blue-200 dark:border-blue-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isFinanceSigned ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
            }`}
          >
            <Building2 size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white">Department 2: Finance Authorization</h4>
            <p className="text-[11px] text-stone-500 dark:text-gray-400">
              Authorizes bank liquidity, funds release, and statutory withholdings.
            </p>
          </div>
        </div>
        {isFinanceSigned ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <CheckCircle2 size={12} /> Authorized
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Clock size={12} /> Pending Finance
          </span>
        )}
      </div>

      {isFinanceSigned ? (
        <div className="mt-3 p-3 bg-stone-100/80 dark:bg-black/30 rounded-xl text-xs space-y-1 border border-[#E2DCCE] dark:border-white/5">
          <div className="flex justify-between text-stone-700 dark:text-gray-300">
            <span className="text-stone-500 dark:text-gray-500">Signatory:</span>
            <span className="font-bold text-[#1E3F27] dark:text-white">
              {activeRun.financeApprovedBy} ({activeRun.financeApprovedByRole || 'Finance'})
            </span>
          </div>
          {activeRun.financeApprovedAt && (
            <div className="flex justify-between text-stone-700 dark:text-gray-300">
              <span className="text-stone-500 dark:text-gray-500">Authorized At:</span>
              <span className="font-mono text-stone-500 dark:text-gray-400">
                {new Date(activeRun.financeApprovedAt).toLocaleString()}
              </span>
            </div>
          )}
          {activeRun.financeNotes && (
            <div className="pt-1 text-stone-500 dark:text-gray-400 italic">"{activeRun.financeNotes}"</div>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[#E2DCCE] dark:border-white/5">
          {isFinance ? (
            isCurrentUserHrSignatory && !isSuperAdminOrCeo ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={14} /> Zero-Trust Notice: You already certified as HR. A
                distinct Finance officer must authorize this department.
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={financeNotesInput}
                  onChange={e => setFinanceNotesInput(e.target.value)}
                  placeholder="Finance authorization notes (e.g. Bank balance verified)..."
                  className="woody-input text-xs"
                />
                <button
                  onClick={handleSignFinance}
                  disabled={isActionLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Building2 size={14} />}
                  Authorize Funds as Finance
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-stone-500 dark:text-gray-400 italic">
              Awaiting sign-off by Finance Department (finance_manager).
            </p>
          )}
        </div>
      )}
    </div>
  );
};
