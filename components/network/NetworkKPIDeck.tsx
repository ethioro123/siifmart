import React from 'react';
import { Building, Store, Package, DollarSign, TrendingUp } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { useStore } from '../../contexts/CentralStore';
import { hasPermission } from '../../utils/permissions';

interface NetworkKPIDeckProps {
    totalWarehouses: number;
    totalStores: number;
    totalNetworkProducts: number;
    totalNetworkAssetValue: number;
    totalPotentialRevenue: number;
    uniqueNetworkSKUs?: number;
    totalNetworkUnits?: number;
}

export const NetworkKPIDeck: React.FC<NetworkKPIDeckProps> = ({
    totalWarehouses,
    totalStores,
    totalNetworkProducts,
    totalNetworkAssetValue,
    totalPotentialRevenue,
    uniqueNetworkSKUs,
    totalNetworkUnits
}) => {
    const { user } = useStore();
    const canViewCost = hasPermission(user?.role, 'VIEW_COST_PRICE');

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[var(--theme-accent)] transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                        <Building size={18} />
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Warehouses</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{totalWarehouses}</p>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[var(--theme-accent)] transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Store size={18} />
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Retail Stores</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{totalStores}</p>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[var(--theme-accent)] transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                        <Package size={18} />
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Catalog SKUs</span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{uniqueNetworkSKUs || totalNetworkProducts}</p>
                    {totalNetworkUnits !== undefined && (
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium">({formatCompactNumber(totalNetworkUnits)} units)</span>
                    )}
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[var(--theme-accent)] transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                        <DollarSign size={18} />
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Asset Value</span>
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                    {canViewCost ? formatCompactNumber(totalNetworkAssetValue, { currency: CURRENCY_SYMBOL }) : '••••••'}
                </p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[var(--theme-accent)] transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                        <TrendingUp size={18} />
                    </div>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Potential Rev</span>
                </div>
                <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums truncate">
                    {formatCompactNumber(totalPotentialRevenue, { currency: CURRENCY_SYMBOL })}
                </p>
            </div>
        </div>
    );
};
export default NetworkKPIDeck;
