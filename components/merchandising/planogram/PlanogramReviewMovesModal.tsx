import React, { useEffect, useRef, useState } from 'react';
import type { ProposedPlanogramMove } from './types';

interface Props {
  isOpen: boolean; onClose: () => void; moves: ProposedPlanogramMove[];
  onConfirm: (moves: ProposedPlanogramMove[]) => Promise<void>; isSubmitting: boolean;
}

export function PlanogramReviewMovesModal({ isOpen, onClose, moves, onConfirm, isSubmitting }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkedInStore, setCheckedInStore] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set()); setCheckedInStore(false);
      if (!dialog.current?.open) dialog.current?.showModal();
    } else dialog.current?.close();
  }, [isOpen]);
  const selectedMoves = moves.filter(move => selected.has(move.productId));
  return <dialog ref={dialog} aria-labelledby="planogram-review-title" onCancel={event => {
    event.preventDefault(); if (!isSubmitting) onClose();
  }} className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 text-[var(--theme-text-primary)] backdrop:bg-black/60">
    <h2 id="planogram-review-title" className="text-lg font-semibold">Review suggested shelf moves</h2>
    <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">Candidates use recorded sales from loaded completed orders. Check weight, available space, storage requirements and category fit in store before selecting moves.</p>
    <fieldset disabled={isSubmitting} className="my-4 space-y-3">
      {moves.length === 0 && <p>No sales-based move candidates are available for this store.</p>}
      {moves.map(move => <label key={move.productId} className="flex items-start gap-3 rounded-xl border border-[var(--theme-border)] p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={selected.has(move.productId)} onChange={() => {
          setSelected(previous => { const next = new Set(previous); if (next.has(move.productId)) next.delete(move.productId); else next.add(move.productId); return next; });
        }} />
        <span><strong>{move.productName}</strong> · {move.productSku}<br />{move.currentPosition} → {move.targetPosition} · {move.unitsSold7d} recorded units / 7 days<br /><span className="text-[var(--theme-text-secondary)]">{move.reason}</span></span>
      </label>)}
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={checkedInStore} onChange={e => setCheckedInStore(e.target.checked)} className="mt-1" /><span>I checked the selected placements for physical suitability in store.</span></label>
    </fieldset>
    <p role="status" className="text-sm">{selectedMoves.length} moves selected. Submission creates proposals; placements update after three regional approvals.</p>
    <div className="mt-4 flex flex-wrap justify-end gap-3">
      <button type="button" disabled={isSubmitting} onClick={onClose} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4">Cancel</button>
      <button type="button" disabled={isSubmitting || !checkedInStore || selectedMoves.length === 0} onClick={() => onConfirm(selectedMoves)} className="min-h-11 rounded-xl bg-[var(--theme-accent)] px-4 text-white disabled:opacity-50">{isSubmitting ? 'Submitting…' : 'Submit selected moves'}</button>
    </div>
  </dialog>;
}
