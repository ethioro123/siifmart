import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import type { ProposedPlanogramMove } from './types';

interface PlanogramReviewMovesModalProps {
  isOpen: boolean;
  onClose: () => void;
  moves: ProposedPlanogramMove[];
  onConfirm: (selectedMoves: ProposedPlanogramMove[]) => Promise<void>;
  isSubmitting: boolean;
}

export const PlanogramReviewMovesModal: React.FC<PlanogramReviewMovesModalProps> = ({
  isOpen,
  onClose,
  moves,
  onConfirm,
  isSubmitting
}) => {
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    moves.forEach(m => {
      initial[m.productId] = true;
    });
    return initial;
  });

  if (!isOpen) return null;

  const toggleSelect = (productId: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const selectedMoves = moves.filter(m => selectedMap[m.productId]);

  const handleSubmit = async () => {
    if (selectedMoves.length === 0) return;
    await onConfirm(selectedMoves);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-moves-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 id="review-moves-title" className="text-base font-semibold text-[var(--theme-text-primary)]">
                Review Suggested Planogram Moves
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Validated against physical shelf safety, ergonomics, and capacity limits.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {moves.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-2xl">
              <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-sm text-[var(--theme-text-primary)]">
                No optimization moves suggested
              </p>
              <p className="mt-1">
                All high-velocity products on this fixture comply with shelf constraints and optimal placement.
              </p>
            </div>
          ) : (
            <>
              {/* Constraints Banner */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                <span>
                  <strong>Constraint rules active:</strong> Heavy items (> 5kg) locked to bottom shelf for ergonomics; shelf capacity limits enforced; verified category compatibility.
                </span>
              </div>

              {/* Before / After Table */}
              <div className="border border-[var(--theme-border)] rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase">
                    <tr>
                      <th scope="col" className="p-3 w-10 text-center">
                        Select
                      </th>
                      <th scope="col" className="p-3">Product</th>
                      <th scope="col" className="p-3">Current Placement</th>
                      <th scope="col" className="p-3">Proposed Move</th>
                      <th scope="col" className="p-3">7d Sales</th>
                      <th scope="col" className="p-3">Reason & Constraints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                    {moves.map(m => {
                      const isChecked = selectedMap[m.productId] ?? true;
                      return (
                        <tr
                          key={m.productId}
                          className={`hover:bg-[var(--theme-bg-subtle)]/40 transition-colors ${
                            isChecked ? 'bg-[var(--theme-bg-card)]' : 'opacity-60 bg-[var(--theme-bg-subtle)]/20'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelect(m.productId)}
                              aria-label={`Select move for ${m.productName}`}
                              className="rounded border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-[var(--theme-text-primary)]">{m.productName}</p>
                            <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">{m.productSku}</p>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] font-medium text-[var(--theme-text-secondary)]">
                              {m.currentPosition}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-semibold text-[11px] border border-[var(--theme-accent)]/20 flex items-center gap-1 w-fit">
                              <ArrowRight size={11} />
                              <span>{m.targetPosition}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono font-semibold text-[var(--theme-text-primary)]">
                            {m.unitsSold7d} units
                          </td>
                          <td className="p-3 text-[11px] text-[var(--theme-text-secondary)]">
                            <p className="text-[var(--theme-text-primary)] font-medium leading-tight">{m.reason}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={11} />
                              <span>Ergonomics & capacity safe</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/50 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--theme-text-secondary)]">
            {selectedMoves.length} of {moves.length} moves selected for atomic revision
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedMoves.length === 0 || isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Submitting Revision…</span>
                </>
              ) : (
                <span>Submit Layout Revision ({selectedMoves.length})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
