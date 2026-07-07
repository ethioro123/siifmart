import React from 'react';
import { CURRENCY_SYMBOL } from '../../../constants';

interface SalesAnalyticsRibbonProps {
   metrics: {
      totalRev: number;
      txCount: number;
      avgTicket: number;
   };
   totalCount: number;
}

export const SalesAnalyticsRibbon: React.FC<SalesAnalyticsRibbonProps> = ({ metrics, totalCount }) => {
   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white/80 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md p-4 rounded-2xl shadow-sm transition-colors">
            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-wider">Page Revenue</p>
            <p className="text-xl font-mono font-black text-[#1E3F27] dark:text-[#EAE5D9] mt-1">{CURRENCY_SYMBOL} {metrics.totalRev.toLocaleString()}</p>
         </div>
         <div className="bg-white/80 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md p-4 rounded-2xl shadow-sm transition-colors">
            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-wider">Page Transactions</p>
            <p className="text-xl font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] mt-1">{metrics.txCount}</p>
         </div>
         <div className="bg-white/80 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md p-4 rounded-2xl shadow-sm transition-colors">
            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-wider">Avg Basket (Page)</p>
            <p className="text-xl font-mono font-black text-amber-700 dark:text-amber-455 mt-1">{CURRENCY_SYMBOL} {metrics.avgTicket.toFixed(0)}</p>
         </div>
         <div className="bg-white/80 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md p-4 rounded-2xl shadow-sm transition-colors">
            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-wider">Total History Size</p>
            <p className="text-xl font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] mt-1">{totalCount.toLocaleString()}</p>
         </div>
      </div>
   );
};
