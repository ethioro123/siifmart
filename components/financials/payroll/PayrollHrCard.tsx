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
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-amber-50/50 dark:bg-stone-900/60 border-amber-200 dark:border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isHrSigned ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <UserCheck size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white">Department 1: HR Certification</h4>
            <p className="text-[11px] text-stone-500 dark:text-gray-400">
              Verifies employee roster, attendance, leaves, and active employment.
            </p>
          </div>
        </div>
        {isHrSigned ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <CheckCircle2 size={12} /> Certified
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Clock size={12} /> Pending HR
          </span>
        )}
      </div>

      {isHrSigned ? (
        <div className="mt-3 p-3 bg-stone-100/80 dark:bg-black/30 rounded-xl text-xs space-y-1 border border-[#E2DCCE] dark:border-white/5">
          <div className="flex justify-between text-stone-700 dark:text-gray-300">
            <span className="text-stone-500 dark:text-gray-500">Signatory:</span>
            <span className="font-bold text-[#1E3F27] dark:text-white">
              {activeRun.hrApprovedBy} ({activeRun.hrApprovedByRole || 'HR'})
            </span>
          </div>
          {activeRun.hrApprovedAt && (
            <div className="flex justify-between text-stone-700 dark:text-gray-300">
              <span className="text-stone-500 dark:text-gray-500">Signed At:</span>
              <span className="font-mono text-stone-500 dark:text-gray-400">
                {new Date(activeRun.hrApprovedAt).toLocaleString()}
              </span>
            </div>
          )}
          {activeRun.hrNotes && (
            <div className="pt-1 text-stone-500 dark:text-gray-400 italic">"{activeRun.hrNotes}"</div>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-[#E2DCCE] dark:border-white/5">
          {isHR ? (
            isCurrentUserFinanceSignatory && !isSuperAdminOrCeo ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={14} /> Zero-Trust Notice: You already signed as Finance. A
                distinct HR officer must certify this department.
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={hrNotesInput}
                  onChange={e => setHrNotesInput(e.target.value)}
                  placeholder="HR verification notes (e.g. Roster & attendance audited)..."
                  className="woody-input text-xs"
                />
                <button
                  onClick={handleSignHR}
                  disabled={isActionLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={14} />}
                  Certify Roster as HR
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-stone-500 dark:text-gray-400 italic">
              Awaiting sign-off by HR Department (hr_manager or hr).
            </p>
          )}
        </div>
      )}
    </div>
  );
};
