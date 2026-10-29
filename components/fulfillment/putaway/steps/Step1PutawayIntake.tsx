import React from 'react';
import { Package, MapPin, Box, ArrowRight, Scan, ShieldCheck, ThermometerSnowflake, Tag } from 'lucide-react';
import { WMSJob, Site, Product } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import { formatProductSize } from '../../../../utils/units';

interface Step1PutawayIntakeProps {
    job: WMSJob;
    sourceSite: Site | undefined;
    totalItems: number;
    totalUnits: number;
    hasColdItems: boolean;
    getProduct: (item: any) => Product | undefined;
    onAdvanceToRouting: () => void;
    onStartPutaway: (job: WMSJob) => void;
    resolveOrderRef: (ref?: string) => string;
    t: (key: string) => string;
}

export const Step1PutawayIntake: React.FC<Step1PutawayIntakeProps> = ({
    job,
    sourceSite,
    totalItems,
    totalUnits,
    hasColdItems,
    getProduct,
    onAdvanceToRouting,
    onStartPutaway,
    resolveOrderRef,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Intake Overview Card */}
            <div className="p-4 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 w-full">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                        <Package size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                                {t('warehouse.putaway.inboundStagingIntake') || 'Inbound Staging Intake'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[11px] font-mono font-semibold text-[var(--theme-text-primary)]">
                                {totalItems} {t('warehouse.putaway.lines') || 'Lines'} · {totalUnits} {t('warehouse.unitsLabel') || 'Units'}
                            </span>
                            {hasColdItems && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] text-[11px] font-bold text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] flex items-center gap-1 uppercase">
                                    <ThermometerSnowflake size={11} /> {t('warehouse.putaway.coldChain') || 'Cold Chain'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 break-words">
                            {t('warehouse.putaway.verifyCargoPrompt') || 'Verify cargo at inbound dock staging before routing to warehouse storage bins.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">

                </div>
            </div>

            {/* Inbound Manifest Checklist */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Box size={16} className="text-[var(--theme-accent)]" />
                        {t('warehouse.putaway.inboundItemsManifest') || 'Inbound Items Manifest'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--theme-text-secondary)]">
                        {totalItems} {t('warehouse.putaway.lineItemsCount') || 'Line Items'}
                    </span>
                </div>

                <div className="space-y-2.5">
                    {job.lineItems?.map((item, idx) => {
                        const prod = getProduct(item);
                        const expected = item.expectedQty || (item as any).quantity || 1;

                        return (
                            <div
                                key={idx}
                                className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0 w-full flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                                        {prod?.image ? (
                                            <img src={prod.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={18} className="text-[var(--theme-text-secondary)]" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold uppercase break-words text-[var(--theme-text-primary)]">
                                            {item.name || prod?.name || 'Unknown SKU'}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-mono break-all text-[var(--theme-text-secondary)]">
                                                {item.sku || prod?.sku}
                                            </span>
                                            {formatProductSize(prod || item) && (
                                                <span className="text-[11px] font-mono text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-2 py-0.5 rounded border border-[var(--theme-status-success-border)]">
                                                    {formatProductSize(prod || item)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:justify-end shrink-0">
                                    <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-lg border border-[var(--theme-border)]">
                                        {expected} {item.unit || prod?.unit || (t('warehouse.unitsLabel') || 'Units')}
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
