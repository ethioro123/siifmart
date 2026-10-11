import React from 'react';
import { CheckCircle, PackageCheck, MapPin } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { getSellUnit } from '../../../../utils/units';

interface PickScannerSummaryProps {
    job: WMSJob;
    getProduct: (item: any) => Product | undefined;
    getItemMeasureQty?: (item: any, prod?: Product | null) => number | null;
    t: (key: string) => string;
}

export const PickScannerSummary: React.FC<PickScannerSummaryProps> = ({
    job,
    getProduct,
    t,
}) => {
    const items = job.lineItems || [];
    const totalItems = items.length;

    return (
        <div className="w-full max-w-lg mx-auto z-10 my-2 space-y-4 text-center animate-in fade-in duration-200">
            {/* Top Success Badge */}
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-3">
                    <PackageCheck size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                    {t('warehouse.picking.missionComplete') || 'Mission Complete'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-emerald-500 uppercase tracking-wider mt-1">
                    {totalItems} {totalItems === 1 ? 'Product' : 'Products'} Successfully Picked
                </p>
            </div>

            {/* Detailed Picked Items Card */}
            <div className="bg-[var(--theme-bg-card)] rounded-2xl p-4 sm:p-5 border border-[var(--theme-border)] text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        {t('warehouse.picking.missionSummary') || 'Picked Inventory Items'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {totalItems}/{totalItems} Completed
                    </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {items.map((item: any, idx: number) => {
                        const prod = getProduct(item);
                        const expected = item.expectedQty || item.quantity || 1;
                        const picked = item.pickedQty || item.quantity || expected;
                        const unitDef = getSellUnit(prod?.unit || item.unit);
                        const sizeStr = prod?.size || item.size;
                        const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                        const unitText = isWeightVol ? `${sizeStr}${unitDef.shortLabel}` : unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'EA';
                        const loc = item.location || prod?.location;

                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] truncate uppercase">
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-1.5 py-0.5 rounded-md border border-[var(--theme-accent)]/20 uppercase">
                                            {item.sku}
                                        </span>
                                        {loc && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                <MapPin size={11} className="text-[var(--theme-accent)]" />
                                                {loc}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-mono font-bold text-emerald-500">
                                            {picked} / {expected}
                                        </span>
                                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] uppercase">
                                            {unitText}
                                        </span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Subtext info */}
            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium max-w-sm mx-auto leading-relaxed">
                {t('warehouse.picking.finalizeMissionInfo') || 'Click below to finalize this mission and create the Packing job.'}
            </p>
        </div>
    );
};
