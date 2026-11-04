import { formatLocationIdentity } from '../../../utils/locationIdentity';
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
    batchNumber?: string | null;
    expiryDate?: string | null;
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-[var(--theme-text-secondary)] shrink-0" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">Loaded stock by lot and location</h3>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                    {formattedTotal} across {locationBreakdown.length} {locationBreakdown.length === 1 ? 'Record' : 'Records'}
                </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                Totals cover the loaded records in this country. Each lot and bay is retained; this is not a complete live stock query.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {locationBreakdown.map((loc, i) => (
                    <div
                        key={loc.id || i}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                            loc.isCurrentSite
                                ? 'bg-[color-mix(in_srgb,var(--theme-accent)_6%,var(--theme-bg-card))] border-[color-mix(in_srgb,var(--theme-accent)_30%,var(--theme-border))] shadow-xs'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-[var(--theme-text-primary)] leading-snug break-words">
                                        {loc.siteName}
                                    </span>
                                    {loc.isCurrentSite && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)] shrink-0">
                                            Current Site
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono tabular-nums border shrink-0 ${
                                    loc.stock > 0
                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                        : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                }`}
                            >
                                {formatStockDisplay(loc.stock, product)}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pt-2.5 border-t border-[var(--theme-border)] text-xs text-[var(--theme-text-secondary)]">
                            <span className="font-mono text-xs text-[var(--theme-text-secondary)]">
                                {formatLocationIdentity(loc.location, 'Location not assigned')}
                            </span>
                            {(loc.batchNumber || loc.expiryDate) && (
                                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-[var(--theme-text-secondary)]">
                                    {loc.batchNumber && (
                                        <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] break-all">
                                            Lot {loc.batchNumber}
                                        </span>
                                    )}
                                    {loc.expiryDate && (
                                        <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shrink-0">
                                            Expiry {loc.expiryDate}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
