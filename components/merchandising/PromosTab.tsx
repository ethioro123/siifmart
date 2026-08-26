import React from 'react';
import { Plus, BarChart3, Tags, Sparkles } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { CURRENCY_SYMBOL } from '../../constants';

export const PromosTab: React.FC = () => {
   const { promotions, setIsPromoModalOpen } = useMerchandising();

   const activeCount = promotions.filter(p => p.status === 'Active').length;

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
         {/* Promo Stats Card */}
         <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Active Campaigns</span>
               <div className="p-1.5 bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                  <BarChart3 size={16} />
               </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
               <span className="text-3xl font-black text-[#1E3F27] dark:text-white font-mono">
                  {activeCount}
               </span>
               <span className="text-xs text-stone-400 font-medium">campaigns running</span>
            </div>
         </div>

         <div className="md:col-span-2 flex justify-end items-center">
            <button
               type="button"
               onClick={() => setIsPromoModalOpen(true)}
               className="woody-btn-primary px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
            >
               <Plus size={15} />
               <span>New Promotion Campaign</span>
            </button>
         </div>

         {/* Promo Grid Cards or Empty State */}
         {promotions.length > 0 ? (
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {promotions.map(promo => (
                  <div
                     key={promo.id}
                     className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all hover:border-[#2C5E3B]/40 group"
                  >
                     <div
                        className={`absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider border-b border-l ${
                           promo.status === 'Active'
                              ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30'
                              : 'bg-[#FAF8F5] text-stone-400 dark:bg-black/30 dark:text-stone-500 border-[#E2DCCE] dark:border-white/10'
                        }`}
                     >
                        {promo.status}
                     </div>

                     <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1.5">
                           <Tags size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Promo Voucher</span>
                        </div>
                        <h3 className="text-xl font-black text-[#1E3F27] dark:text-white font-mono tracking-wide">{promo.code}</h3>
                     </div>

                     <div className="flex justify-between items-end border-t border-[#E2DCCE]/60 dark:border-white/5 pt-4">
                        <div>
                           <p className="text-[10px] text-stone-400 uppercase font-bold mb-0.5">Discount Offer</p>
                           <p className="text-base font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
                              {promo.type === 'FIXED' ? CURRENCY_SYMBOL : ''}
                              {promo.value}
                              {promo.type === 'PERCENTAGE' ? '%' : ''} OFF
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-stone-400 uppercase font-bold mb-0.5">Redemptions</p>
                           <p className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">{promo.usageCount || 0} used</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="md:col-span-3 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-12 text-center shadow-sm">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center mx-auto mb-3 text-[#2C5E3B] dark:text-[#A9CBA2]">
                  <Tags size={22} />
               </div>
               <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-1">No Active Campaigns</h4>
               <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-5">
                  Launch a promotional discount code or voucher to drive customer sales volume and conversions.
               </p>
               <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(true)}
                  className="woody-btn-primary px-6 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-sm"
               >
                  <Plus size={15} />
                  <span>Create Promotion Campaign</span>
               </button>
            </div>
         )}
      </div>
   );
};
