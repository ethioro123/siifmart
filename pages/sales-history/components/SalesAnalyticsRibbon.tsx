import React from 'react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useStore } from '../../../contexts/CentralStore';
import { hasPermission } from '../../../utils/permissions';
import { Shield, TrendingUp, Receipt, ShoppingBag, Layers } from 'lucide-react';

interface SalesAnalyticsRibbonProps {
   metrics: {
      totalRev: number;
      txCount: number;
      avgTicket: number;
   };
   totalCount: number;
   currencySymbol?: string;
}

export const SalesAnalyticsRibbon: React.FC<SalesAnalyticsRibbonProps> = ({ metrics, totalCount, currencySymbol = CURRENCY_SYMBOL }) => {
   const { user } = useStore();
   const canViewRevenue = hasPermission(user?.role, 'VIEW_REVENUE');

   return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
         {/* Page Revenue Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--shadow-sm)] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                     <TrendingUp size={16} />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                     Page Revenue
                  </span>
               </div>
               {!canViewRevenue && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-full font-medium">
                     <Shield size={12} /> Hidden
                  </span>
               )}
            </div>
            <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-[var(--theme-text-primary)]">
               {canViewRevenue ? `${currencySymbol} ${metrics.totalRev.toLocaleString()}` : '••••••'}
            </p>
         </div>

         {/* Page Transactions Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--shadow-sm)] transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-3">
               <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Receipt size={16} />
               </div>
               <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                  Page Volume
               </span>
            </div>
            <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-[var(--theme-text-primary)]">
               {metrics.txCount.toLocaleString()}
            </p>
         </div>

         {/* Average Basket Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--shadow-sm)] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                     <ShoppingBag size={16} />
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                     Avg Basket
                  </span>
               </div>
               {!canViewRevenue && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-full font-medium">
                     <Shield size={12} /> Hidden
                  </span>
               )}
            </div>
            <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-[var(--theme-text-primary)]">
               {canViewRevenue ? `${currencySymbol} ${Math.round(metrics.avgTicket).toLocaleString()}` : '••••••'}
            </p>
         </div>

         {/* Total History Size Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 sm:p-5 rounded-2xl shadow-[var(--shadow-sm)] transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-3">
               <div className="w-8 h-8 rounded-xl bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_10%,transparent)] text-[var(--theme-text-secondary)] flex items-center justify-center shrink-0">
                  <Layers size={16} />
               </div>
               <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                  Total History
               </span>
            </div>
            <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-[var(--theme-text-primary)]">
               {totalCount.toLocaleString()}
            </p>
         </div>
      </div>
   );
};

