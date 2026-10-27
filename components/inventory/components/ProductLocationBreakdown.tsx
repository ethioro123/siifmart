import {formatLocationIdentity} from '../../../utils/locationIdentity';
import React from 'react';
import { Building2 } from 'lucide-react';
import { Product } from '../../../types';
import { formatStockDisplay } from '../../../utils/units';

interface LocationBreakdownItem {
    id: string;
    siteName: string;
    location: string;
    stock: number;
    price: number;
    minStock?: number;
    isCurrentSite: boolean;
    batchNumber?: string|null;
    expiryDate?: string|null;
}

interface Props {
    product: Product;
    locationBreakdown: LocationBreakdownItem[];
}

export const ProductLocationBreakdown: React.FC<Props> = ({ product, locationBreakdown }) => {
    if (!locationBreakdown || locationBreakdown.length === 0) return null;

    const totalStockSum = locationBreakdown.reduce((sum, l) => sum + l.stock, 0);
    const formattedTotal = formatStockDisplay(totalStockSum, product);

    return (
        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
                <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-[var(--theme-text-secondary)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Loaded stock by lot and location</h3>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                    {formattedTotal} across {locationBreakdown.length} {locationBreakdown.length === 1 ? 'Record' : 'Records'}
                </span>
            </div>
            <p className="text-sm text-[var(--theme-text-secondary)]">Totals cover the loaded records in this country. Each lot and bay is retained; this is not a complete live stock query.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {locationBreakdown.map((loc, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                            loc.isCurrentSite
                                ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/40 shadow-xs'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                        }`}
                    >
                        <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{loc.siteName}</span>
                                {loc.isCurrentSite && (
                                    <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-[var(--theme-accent)] text-white">This Store</span>
                                )}
                            </div>
                            <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5 truncate">{formatLocationIdentity(loc.location,'Location not assigned')}</p>
                        </div>
                        <div className="text-right shrink-0">
                            {loc.batchNumber&&<p className="text-xs text-[var(--theme-text-secondary)]">Lot {loc.batchNumber}</p>}
                            {loc.expiryDate&&<p className="text-xs text-[var(--theme-text-secondary)]">Expiry {loc.expiryDate}</p>}
                            <p className={`text-xs font-bold font-mono ${loc.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {formatStockDisplay(loc.stock, product)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
