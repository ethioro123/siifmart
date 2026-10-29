import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import Modal from '../Modal';

interface BulkDiscountModalProps {
   isOpen: boolean;
   onClose: () => void;
   selectedIdsCount: number;
   bulkDiscountValue: string;
   setBulkDiscountValue: (val: string) => void;
   handleApplyBulkDiscount: () => void;
   isSubmitting: boolean;
}

export const BulkDiscountModal: React.FC<BulkDiscountModalProps> = ({
   isOpen,
   onClose,
   selectedIdsCount,
   bulkDiscountValue,
   setBulkDiscountValue,
   handleApplyBulkDiscount,
   isSubmitting,
}) => {
   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title="Apply Bulk Discount"
      >
         <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-[11px] font-medium">
               <ShieldAlert size={14} className="shrink-0 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" />
               <span>Proposals need regional Operations, Supply Chain and Merchandising approval. Prices below the 15% margin floor also need independent Finance signoff. Selling prices round to whole numbers.</span>
            </div>

            <p className="text-xs text-[var(--theme-text-secondary)]">
               Enter the discount percentage to apply to <span className="font-semibold text-[var(--theme-text-primary)] font-mono">{selectedIdsCount}</span> selected product{selectedIdsCount !== 1 ? 's' : ''}.
            </p>
            <div>
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1 block">Discount Percentage</label>
               <input
                  type="number" min="0.01" max="99.99" step="0.01"
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-mono font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                  placeholder="e.g. 20 for 20% off"
                  value={bulkDiscountValue}
                  onChange={(e) => setBulkDiscountValue(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') handleApplyBulkDiscount();
                  }}
                  autoFocus
                  aria-label="Bulk Discount Percentage"
               />
            </div>
            <button
               type="button"
               onClick={handleApplyBulkDiscount}
               disabled={!bulkDiscountValue || isSubmitting}
               className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isSubmitting ? (
                  <>
                     <Loader2 size={16} className="animate-spin" />
                     <span>Preparing preview…</span>
                  </>
               ) : `Review ${bulkDiscountValue}% discount`}
            </button>
         </div>
      </Modal>
   );
};
