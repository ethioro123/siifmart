import React from 'react';
import { Plus, BarChart3, Tags } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { CURRENCY_SYMBOL } from '../../constants';

export const PromosTab: React.FC = () => {
   const { promotions, setIsPromoModalOpen } = useMerchandising();

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
         {/* Promo Stats */}
         <div className="glass-panel p-6">
            <h3 className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase mb-4">Active Campaigns</h3>
            <div className="flex items-end justify-between">
               <span className="text-4xl font-bold text-[#1E3F27] dark:text-white font-mono">
                  {promotions.filter(p => p.status === 'Active').length}
               </span>
               <BarChart3 className="text-[#2C5E3B] dark:text-[#A9CBA2] mb-2" />
            </div>
         </div>

         <div className="md:col-span-2 flex justify-end items-start">
            <button
               onClick={() => setIsPromoModalOpen(true)}
               className="woody-btn-primary px-6 py-3 flex items-center shadow-sm"
            >
               <Plus size={18} className="mr-2" />
               New Promotion
            </button>
         </div>

         <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promo => (
               <div
                  key={promo.id}
                  className="glass-panel p-6 relative overflow-hidden group hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:scale-[1.01] duration-300"
               >
                  <div
                     className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider border-b border-l ${
                        promo.status === 'Active'
                           ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-[#E2DCCE] dark:border-emerald-950/20'
                           : 'bg-stone-100 dark:bg-gray-500/10 text-stone-500 dark:text-stone-400 border-[#E2DCCE] dark:border-emerald-950/20'
                     }`}
                  >
                     {promo.status}
                  </div>

                  <div className="mb-4">
                     <div className="flex items-center gap-2 mb-1">
                        <Tags size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="text-xs text-stone-400 dark:text-stone-500">Promo Code</span>
                     </div>
                     <h3 className="text-2xl font-bold text-[#1E3F27] dark:text-white font-mono tracking-wider">{promo.code}</h3>
                  </div>
                  <div className="flex justify-between items-end border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 pt-4">
                     <div>
                        <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">Discount Value</p>
                        <p className="text-lg font-bold text-[#1E3F27] dark:text-white">
                           {promo.type === 'FIXED' ? CURRENCY_SYMBOL : ''}
                           {promo.value}
                           {promo.type === 'PERCENTAGE' ? '%' : ''} OFF
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">Redemptions</p>
                        <p className="text-sm font-mono text-[#1E3F27] dark:text-white">{promo.usageCount}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};
