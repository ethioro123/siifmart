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
      <Modal isOpen={isOpen} onClose={onClose} title="Create Promotional Campaign">
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Promo Code</label>
               <input
                  className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white uppercase font-mono font-bold focus:border-[#2C5E3B] outline-none"
                  placeholder="e.g. FLASH50, SUMMER20"
                  value={newPromo.code || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                  aria-label="Promo Code"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Discount Type</label>
                  <select
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold cursor-pointer"
                     value={newPromo.type}
                     onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                     aria-label="Promo Type"
                  >
                     <option value="PERCENTAGE">Percentage (%)</option>
                     <option value="FIXED">Fixed Discount (ETB)</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Discount Value</label>
                  <input
                     type="number"
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                     value={newPromo.value || ''}
                     onChange={(e) => setNewPromo({ ...newPromo, value: parseFloat(e.target.value) })}
                     placeholder="0"
                     aria-label="Promo Value"
                  />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Expiration Date</label>
               <input
                  type="date"
                  className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
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
                  className="woody-btn-primary w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
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
