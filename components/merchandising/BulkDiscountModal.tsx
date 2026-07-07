import React from 'react';
import { Loader2 } from 'lucide-react';
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
            <p className="text-sm text-stone-500 dark:text-stone-400">
               Enter the discount percentage to apply to {selectedIdsCount} selected product{selectedIdsCount !== 1 ? 's' : ''}.
            </p>
            <div>
               <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Discount Percentage</label>
               <input
                  type="number"
                  className="woody-input"
                  placeholder="e.g., 20 for 20% off"
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
               onClick={handleApplyBulkDiscount}
               disabled={!bulkDiscountValue || isSubmitting}
               className="woody-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isSubmitting ? (
                  <>
                     <Loader2 size={18} className="animate-spin" />
                     <span>Applying...</span>
                  </>
               ) : `Apply ${bulkDiscountValue}% Discount`}
            </button>
         </div>
      </Modal>
   );
};
