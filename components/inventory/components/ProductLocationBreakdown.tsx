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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Multi-Site & Store Stock Breakdown</h3>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)]">
                    {formattedTotal} Across {locationBreakdown.length} {locationBreakdown.length === 1 ? 'Location' : 'Locations'}
                </span>
            </div>
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
                            <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5 truncate">Shelf / Bin: {loc.location}</p>
                        </div>
                        <div className="text-right shrink-0">
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
