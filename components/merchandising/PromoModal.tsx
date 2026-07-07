import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../Modal';
import type { Promotion } from '../../types';

interface PromoModalProps {
   isOpen: boolean;
   onClose: () => void;
   newPromo: Partial<Promotion>;
   setNewPromo: (promo: Partial<Promotion>) => void;
   handleCreatePromo: () => void;
   isSubmitting: boolean;
}

export const PromoModal: React.FC<PromoModalProps> = ({
   isOpen,
   onClose,
   newPromo,
   setNewPromo,
   handleCreatePromo,
   isSubmitting,
}) => {
   return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Promotion">
         <div className="space-y-4">
            <div>
               <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Promo Code</label>
               <input
                  className="woody-input uppercase font-mono"
                  placeholder="e.g. FLASH50"
                  value={newPromo.code || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                  aria-label="Promo Code"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Type</label>
                  <select
                     className="woody-input"
                     value={newPromo.type}
                     onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                     aria-label="Promo Type"
                  >
                     <option value="PERCENTAGE" className="bg-white dark:bg-[#1E2822]">Percentage (%)</option>
                     <option value="FIXED" className="bg-white dark:bg-[#1E2822]">Fixed Amount</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Value</label>
                  <input
                     type="number"
                     className="woody-input"
                     value={newPromo.value || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, value: parseFloat(e.target.value) })}
                     aria-label="Promo Value"
                  />
               </div>
            </div>
            <div>
               <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Expiry Date</label>
               <input
                  type="date"
                  className="woody-input"
                  value={newPromo.expiryDate || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                  aria-label="Promo Expiry"
               />
            </div>
            <button
               onClick={handleCreatePromo}
               disabled={isSubmitting}
               className="woody-btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
               {isSubmitting ? (
                  <>
                     <Loader2 size={18} className="animate-spin" />
                     <span>Launching...</span>
                  </>
               ) : 'Launch Campaign'}
            </button>
         </div>
      </Modal>
   );
};
