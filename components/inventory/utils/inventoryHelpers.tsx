import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Product, Site } from '../../../types';
import { getSellUnit, getEffectivePackageSize } from '../../../utils/units';

export type LocationDetail = { location: string; stock: number; siteId: string | null; productId: string };

interface LocationDropdownProps {
    count: number;
    details: LocationDetail[];
    sites: Site[];
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({ count, details, sites }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    if (count === 0) return null;

    const getSiteName = (siteId: string | null) => {
        if (!siteId) return 'Unknown Site';
        const site = sites.find(s => s.id === siteId);
        return site ? site.name : 'Unknown Site';
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer max-w-fit"
            >
                <span className="text-[8px] font-bold text-purple-400">+{count} other {count === 1 ? 'location' : 'locations'}</span>
                <ChevronDown size={10} className={`text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-2 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                            <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Also stocked at</span>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                            {details.map((loc, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-[var(--theme-bg-subtle)] transition-colors border-b border-[var(--theme-border)] last:border-0"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-semibold text-[var(--theme-text-primary)] truncate">{loc.location}</span>
                                        <span className="text-[8px] text-[var(--theme-text-muted)] truncate">{getSiteName(loc.siteId)}</span>
                                    </div>
                                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${loc.stock > 10 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : loc.stock > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-500'}`}>
                                        {loc.stock}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const getInventoryValue = (product: Product): number => {
    if (!product.price || product.price <= 0 || !product.stock) return 0;
    const unitDef = getSellUnit(product.unit || '');
    if (unitDef.category === 'weight' || unitDef.category === 'volume') {
        const sizeNum = getEffectivePackageSize(product.unit, product.size);
        if (sizeNum > 0) {
            return product.stock * sizeNum * product.price;
        }
    }
    return product.stock * product.price;
};

export const getDisplayStock = (product: Product): number => {
    if (!product.stock) return 0;
    const unitDef = getSellUnit(product.unit || '');
    if (unitDef.category === 'weight' || unitDef.category === 'volume') {
        const sizeNum = getEffectivePackageSize(product.unit, product.size);
        if (sizeNum > 0) {
            return product.stock * sizeNum;
        }
    }
    return product.stock;
};

export const getABCClass = (product: Product, totalValue: number) => {
    const prodValue = getInventoryValue(product);
    const share = prodValue / totalValue;
    if (share > 0.05) return 'A';
    if (share > 0.02) return 'B';
    return 'C';
};
