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
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)]">
                        <Building size={18} />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Warehouses</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{totalWarehouses}</p>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)]">
                        <Store size={18} />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Retail Stores</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{totalStores}</p>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)]">
                        <Package size={18} />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Catalog SKUs</span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <p className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">{uniqueNetworkSKUs || totalNetworkProducts}</p>
                    {totalNetworkUnits !== undefined && (
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium">({formatCompactNumber(totalNetworkUnits)} units)</span>
                    )}
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)]">
                        <DollarSign size={18} />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Asset Value</span>
                </div>
                <p className="text-xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums truncate">
                    {canViewCost ? formatCompactNumber(totalNetworkAssetValue, { currency: CURRENCY_SYMBOL }) : '••••••'}
                </p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] rounded-xl border border-[var(--theme-border)]">
                        <TrendingUp size={18} />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Potential Rev</span>
                </div>
                <p className="text-xl font-bold font-mono text-[var(--theme-accent)] tabular-nums truncate">
                    {formatCompactNumber(totalPotentialRevenue, { currency: CURRENCY_SYMBOL })}
                </p>
            </div>
        </div>
    );
};
export default NetworkKPIDeck;
