import React from 'react';
import { Route, MapPin, Box, ArrowRight, Scan, Clock, Sparkles } from 'lucide-react';
import { WMSJob, Site, Product } from '../../../../types';
import { formatBeautifulLocation } from '../PickJobModal';

interface Step1PickRouteProps {
    job: WMSJob;
    sortedLineItems: any[];
    sourceSite: Site | undefined;
    totalItems: number;
    totalUnits: number;
    getProduct: (item: any) => Product | undefined;
    onAdvanceToCollect: () => void;
    onStartPick: (job: WMSJob) => void;
    t: (key: string) => string;
}

export const Step1PickRoute: React.FC<Step1PickRouteProps> = ({
    job,
    sortedLineItems,
    sourceSite,
    totalItems,
    totalUnits,
    getProduct,
    onAdvanceToCollect,
    onStartPick,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-3.5 md:space-y-5 bg-[var(--theme-bg-app)]">
            {/* Route Intelligence Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--theme-accent)] text-white flex items-center justify-center shrink-0">
                        <Route size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                                Optimal Pick Route
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[10px] sm:text-[11px] font-mono font-semibold text-[var(--theme-text-primary)] whitespace-nowrap">
                                {totalItems} Stops · {totalUnits} Units
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-snug">
                            Items are sequenced by aisle and shelf to minimize warehouse travel distance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stops Sequence Manifest */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Box size={15} className="text-[var(--theme-accent)]" />
                        Sequence Itinerary
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--theme-text-secondary)]">
                        {totalItems} Locations
                    </span>
                </div>

                <div className="space-y-2">
                    {sortedLineItems.map((item, idx) => {
                        const prod = getProduct(item);
                        const loc = item.location || prod?.location || 'PENDING';
                        const expected = item.expectedQty || (item as any).quantity || 1;
                        const isDone = item.status === 'Completed' || item.status === 'Picked';

                        return (
                            <div
                                key={idx}
                                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition-colors ${
                                    isDone
                                        ? 'bg-green-500/5 border-green-500/20'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs font-mono font-bold text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold uppercase truncate text-[var(--theme-text-primary)]" title={item.name || prod?.name}>
                                            {item.name || prod?.name || 'Unknown SKU'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                            <span className="truncate">{item.sku || prod?.sku}</span>
                                            <span>·</span>
                                            <span className="shrink-0">
                                                Qty: <strong className="text-[var(--theme-text-primary)]">{expected}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center sm:justify-end pl-8.5 sm:pl-0">
                                    {formatBeautifulLocation(loc, 'woody', t)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
