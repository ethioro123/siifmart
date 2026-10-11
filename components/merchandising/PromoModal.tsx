import React from 'react';
import { Loader2, Tags } from 'lucide-react';
import Modal from '../Modal';
import type { Promotion } from '../../types';

interface PromoModalProps {
   isOpen: boolean;
   onClose: () => void;
   newPromo: Partial<Promotion>;
   setNewPromo: (promo: Partial<Promotion>) => void;
   handleCreatePromo: () => void;
   isSubmitting: boolean;
   currencySymbol?: string;
}

export const PromoModal: React.FC<PromoModalProps> = ({
   isOpen,
   onClose,
   newPromo,
   setNewPromo,
   handleCreatePromo,
   isSubmitting,
   currencySymbol = 'ETB',
}) => {
   return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Promotional Campaign">
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Promo Code</label>
               <input
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] uppercase font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                  placeholder="e.g. FLASH50, SUMMER20"
                  value={newPromo.code || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                  aria-label="Promo Code"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Discount Type</label>
                  <select
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                     value={newPromo.type}
                     onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                     aria-label="Promo Type"
                  >
                     <option value="PERCENTAGE">Percentage (%)</option>
                     <option value="FIXED">Fixed Discount ({currencySymbol})</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Discount Value</label>
                  <input
                     type="number"
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-mono font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                     value={newPromo.value || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, value: parseFloat(e.target.value) })}
                     placeholder="0"
                     aria-label="Promo Value"
                  />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Expiration Date</label>
               <input
                  type="date"
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                  value={newPromo.expiryDate || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                  aria-label="Promo Expiry"
               />
            </div>
            <div className="pt-2">
               <button
                  type="button"
                  onClick={handleCreatePromo}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-opacity disabled:opacity-50"
               >
                  {isSubmitting ? (
                     <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Launching...</span>
                     </>
                  ) : (
                     <>
                        <Tags size={15} />
                        <span>Launch Promotion Campaign</span>
                     </>
                  )}
               </button>
            </div>
         </div>
      </Modal>
   );
};

