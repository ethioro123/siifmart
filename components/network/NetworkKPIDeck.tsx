import React from 'react';
import { Building, Store, Package, DollarSign, TrendingUp } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

interface NetworkKPIDeckProps {
    totalWarehouses: number;
    totalStores: number;
    totalNetworkProducts: number;
    totalNetworkAssetValue: number;
    totalPotentialRevenue: number;
}

export const NetworkKPIDeck: React.FC<NetworkKPIDeckProps> = ({
    totalWarehouses,
    totalStores,
    totalNetworkProducts,
    totalNetworkAssetValue,
    totalPotentialRevenue
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                        <Building size={18} />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Warehouses</span>
                </div>
                <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalWarehouses}</p>
            </div>

            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                        <Store size={18} />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Retail Stores</span>
                </div>
                <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalStores}</p>
            </div>

            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                        <Package size={18} />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Products</span>
                </div>
                <p className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white">{totalNetworkProducts}</p>
            </div>

            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                        <DollarSign size={18} />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Asset Value</span>
                </div>
                <p className="text-xl font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] truncate">
                    {formatCompactNumber(totalNetworkAssetValue, { currency: CURRENCY_SYMBOL })}
                </p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                        <TrendingUp size={18} />
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">Potential Rev</span>
                </div>
                <p className="text-xl font-black font-mono text-amber-700 dark:text-amber-400 truncate">
                    {formatCompactNumber(totalPotentialRevenue, { currency: CURRENCY_SYMBOL })}
                </p>
            </div>
        </div>
    );
};
export default NetworkKPIDeck;
