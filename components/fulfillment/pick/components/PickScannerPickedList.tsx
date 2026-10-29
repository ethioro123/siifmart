import React from 'react';
import { CheckCircle } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { getSellUnit, formatProductSize, formatPackagingDescription } from '../../../../utils/units';

interface PickScannerPickedListProps {
    job: WMSJob;
    getProduct: (item: any) => Product | undefined;
    getItemMeasureQty: (item: any, prod?: Product | null) => number | null;
    t: (key: string) => string;
}

export const PickScannerPickedList: React.FC<PickScannerPickedListProps> = ({
    job,
    getProduct,
    getItemMeasureQty,
    t,
}) => {
    const pickedItems = job.lineItems?.filter((i: any) => i.status === 'Picked' || i.status === 'Completed') || [];
    if (pickedItems.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mt-6 z-10 transition-colors">
            <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-sm sm:text-base font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={18} className="text-[var(--theme-status-success-text)]" />
                    {t('warehouse.picking')}
                </h4>
                <span className="text-sm font-mono font-bold text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-3 py-1 rounded-full border border-[var(--theme-status-success-border)]">
                    {pickedItems.length}/{job.lineItems?.length || 0}
                </span>
            </div>
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden divide-y divide-[var(--theme-border)] shadow-sm">
                {pickedItems.map((item: any, idx: number) => {
                    const prod = getProduct(item);
                    return (
                        <div key={idx} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                            <div className="flex-1 min-w-0 mr-3">
                                <p className="text-[var(--theme-text-primary)] text-base sm:text-lg font-bold break-words">{item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[var(--theme-text-secondary)] text-sm font-mono font-semibold break-all">{item.sku}</span>
                                    {formatProductSize(prod || item) && (
                                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-1.5 py-0.2 rounded-md border border-[var(--theme-status-success-border)]">
                                            {formatProductSize(prod || item)}
                                        </span>
                                    )}
                                </div>
                            </div>
                                <span className="bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] text-base font-mono font-bold px-3 py-2 rounded-xl border border-[var(--theme-status-success-border)] whitespace-nowrap">
                                {(() => {
                                    let expected = item.expectedQty || 1;
                                    let picked = item.pickedQty || 0;
                                    const packDesc = formatPackagingDescription(prod, picked);
                                    const unitDef = getSellUnit(prod?.unit || item.unit);
                                    const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                    return (
                                        <>
                                            {picked} / {expected} <span className="text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)] ml-0.5">{unitLabel}</span>
                                            {packDesc && <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] ml-1">({packDesc})</span>}
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
