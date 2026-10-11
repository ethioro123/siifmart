import React from 'react';
import { Plus, BarChart3, Tags } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';

export const PromosTab: React.FC = () => {
   const { promotions, setIsPromoModalOpen, currencySymbol } = useMerchandising();

   const activeCount = promotions.filter(p => p.status === 'Active').length;

   return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
         {/* Promo Stats Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
               <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Active Campaigns</span>
               <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <BarChart3 size={18} />
               </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
               <span className="text-3xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">
                  {activeCount}
               </span>
               <span className="text-xs text-[var(--theme-text-secondary)] font-medium">campaigns running</span>
            </div>
         </div>

         <div className="md:col-span-2 flex justify-end items-center">
            <button
               type="button"
               onClick={() => setIsPromoModalOpen(true)}
               className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer shadow-sm transition-opacity"
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
                     className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all hover:border-[var(--theme-accent)]/40 group"
                  >
                     <div
                        className={`absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl text-[10px] font-semibold uppercase tracking-wider border-b border-l ${
                           promo.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                        }`}
                     >
                        {promo.status}
                     </div>

                     <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1.5">
                           <Tags size={14} className="text-[var(--theme-accent)]" />
                           <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Promo Voucher</span>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tracking-wider">{promo.code}</h3>
                     </div>

                     <div className="flex justify-between items-end border-t border-[var(--theme-border)] pt-4">
                        <div>
                           <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-0.5 tracking-wider">Discount Offer</p>
                           <p className="text-base font-bold text-[var(--theme-accent)] font-mono tabular-nums">
                              {promo.type === 'FIXED' ? `${currencySymbol} ` : ''}
                              {promo.value}
                              {promo.type === 'PERCENTAGE' ? '%' : ''} OFF
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold mb-0.5 tracking-wider">Redemptions</p>
                           <p className="text-xs font-mono font-semibold tabular-nums text-[var(--theme-text-primary)]">{promo.usageCount || 0} used</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="md:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-12 text-center shadow-sm">
               <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center mx-auto mb-3 text-[var(--theme-accent)]">
                  <Tags size={22} />
               </div>
               <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-1">No Active Campaigns</h4>
               <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto mb-5 leading-relaxed">
                  Launch a promotional discount code or voucher to drive customer sales volume and conversions.
               </p>
               <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer shadow-sm transition-opacity"
               >
                  <Plus size={15} />
                  <span>Create Promotion Campaign</span>
               </button>
            </div>
         )}
      </div>
   );
};

