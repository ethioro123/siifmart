import React from 'react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useStore } from '../../../contexts/CentralStore';
import { hasPermission } from '../../../utils/permissions';
import { Shield } from 'lucide-react';

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 rounded-2xl shadow-xs transition-colors">
            <div className="flex items-center justify-between">
               <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Page Revenue</p>
               {!canViewRevenue && <Shield size={12} className="text-amber-500" />}
            </div>
            <p className="text-xl font-mono font-bold text-[var(--theme-text-primary)] mt-1">
               {canViewRevenue ? `${currencySymbol} ${metrics.totalRev.toLocaleString()}` : '••••••'}
            </p>
         </div>
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 rounded-2xl shadow-xs transition-colors">
            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Page Transactions</p>
            <p className="text-xl font-mono font-bold text-[var(--theme-text-primary)] mt-1">{metrics.txCount}</p>
         </div>
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 rounded-2xl shadow-xs transition-colors">
            <div className="flex items-center justify-between">
               <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Avg Basket</p>
               {!canViewRevenue && <Shield size={12} className="text-amber-500" />}
            </div>
            <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
               {canViewRevenue ? `${currencySymbol} ${metrics.avgTicket.toFixed(0)}` : '••••••'}
            </p>
         </div>
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 rounded-2xl shadow-xs transition-colors">
            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">Total History Size</p>
            <p className="text-xl font-mono font-bold text-[var(--theme-text-primary)] mt-1">{totalCount.toLocaleString()}</p>
         </div>
      </div>
   );
};
