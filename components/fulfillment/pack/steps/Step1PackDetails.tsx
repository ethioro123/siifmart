import React from 'react';
import { Package, MapPin, Box, ShieldCheck, ThermometerSnowflake, AlertTriangle, FileText, Clock, UserCheck } from 'lucide-react';
import { WMSJob, Site, Product } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface Step1PackDetailsProps {
    job: WMSJob;
    destSite: Site | undefined;
    totalItems: number;
    hasColdItems: boolean;
    hasFragileItems: boolean;
    expectedWeightKg: number;
    getProduct: (item: any) => Product | undefined;
    resolveOrderRef: (ref?: string) => string;
    t: (key: string) => string;
}

export const Step1PackDetails: React.FC<Step1PackDetailsProps> = ({
    job,
    destSite,
    totalItems,
    hasColdItems,
    hasFragileItems,
    expectedWeightKg,
    getProduct,
    resolveOrderRef,
    t,
}) => {
    const orderRef = resolveOrderRef((job as any).salesOrderId || (job as any).orderId || job.notes);
    const customerOrDest = destSite ? destSite.name : ((job as any).customerName || 'Customer Delivery');

    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Top Mission Briefing Banner */}
            <div className="p-4 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] text-white flex items-center justify-center shrink-0">
                        <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                                Pack Mission Overview
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                                #{formatJobId(job)}
                            </span>
                            {orderRef && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                                    Ref: {orderRef}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">
                            Review parcel destination, handling directives, and cargo manifest before scanning.
                        </p>
                    </div>
                </div>

            </div>

            {/* Key Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Destination & Order */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <MapPin size={13} className="text-[var(--theme-accent)]" />
                            Destination
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            job.priority === 'Critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                            job.priority === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                        }`}>
                            {job.priority} Priority
                        </span>
                    </div>
                    <div className="pt-3 space-y-1">
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] truncate">
                            {customerOrDest}
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                    </div>
                </div>

                {/* Cargo Metrics */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <Package size={13} className="text-[var(--theme-accent)]" />
                            Cargo Scale
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                            Est. {expectedWeightKg} kg
                        </span>
                    </div>
                    <div className="pt-3 grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                            <span className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] block">Line Items</span>
                            <span className="text-base font-mono font-bold text-[var(--theme-text-primary)]">{totalItems} Lines</span>
                        </div>
                    </div>
                </div>

                {/* Handling Alerts */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-[var(--theme-accent)]" />
                            Packaging Directives
                        </span>
                        <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400">
                            Zero-Trust
                        </span>
                    </div>
                    <div className="pt-3 flex flex-wrap gap-1.5">
                        {hasColdItems && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5">
                                <ThermometerSnowflake size={13} />
                                Cold Chain (Ice / Thermal)
                            </span>
                        )}
                        {hasFragileItems && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                                <AlertTriangle size={13} />
                                Fragile (Cushion Wrap)
                            </span>
                        )}
                        {!hasColdItems && !hasFragileItems && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                Standard Corrugated Carton
                            </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center gap-1">
                            <UserCheck size={12} />
                            Mandatory Barcode Scan
                        </span>
                    </div>
                </div>
            </div>

            {/* Cargo Manifest Line Item Preview */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Box size={14} className="text-[var(--theme-accent)]" />
                        Manifest Items Awaiting Scan ({totalItems})
                    </span>
                    <span className="text-xs text-[var(--theme-text-muted)] font-medium">
                        Verification required in next step
                    </span>
                </div>

                <div className="divide-y divide-[var(--theme-border)] max-h-[380px] overflow-y-auto custom-scrollbar">
                    {(job?.lineItems || []).map((item: any, idx: number) => {
                        const product = getProduct(item);
                        return (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 font-mono text-xs font-bold text-[var(--theme-text-secondary)]">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] truncate">
                                            {product?.name || item.name || item.sku || 'Item'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                {item.sku || product?.sku || 'NO-SKU'}
                                            </span>
                                            {product?.category && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]">
                                                    {product.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block">
                                        Scan Required
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
