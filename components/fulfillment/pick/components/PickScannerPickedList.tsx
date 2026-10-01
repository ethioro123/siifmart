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
        <div className="w-full max-w-md mt-6 z-10 transition-colors">
            <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[10px] font-black text-gray-550 uppercase tracking-[0.3em] flex items-center gap-2">
                    <CheckCircle size={10} className="text-green-500" />
                    {t('warehouse.picking')}
                </h4>
                <span className="text-[10px] font-mono font-black text-green-600 dark:text-green-500/60 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20">
                    {pickedItems.length}/{job.lineItems?.length || 0}
                </span>
            </div>
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-sm dark:shadow-none">
                {pickedItems.map((item: any, idx: number) => {
                    const prod = getProduct(item);
                    return (
                        <div key={idx} className="flex items-center justify-between px-4 py-3">
                            <div className="flex-1 min-w-0 mr-3">
                                <p className="text-gray-900 dark:text-white text-sm font-bold truncate">{item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-gray-550 text-[10px] font-mono">{item.sku}</span>
                                    {formatProductSize(prod || item) && (
                                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/20">
                                            {formatProductSize(prod || item)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-mono font-black px-2 py-0.5 rounded-lg border border-green-200 dark:border-green-500/20 whitespace-nowrap">
                                {(() => {
                                    let expected = item.expectedQty || 1;
                                    let picked = item.pickedQty || 0;
                                    const packDesc = formatPackagingDescription(prod, picked);
                                    const unitDef = getSellUnit(prod?.unit || item.unit);
                                    const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                    return (
                                        <>
                                            {picked} / {expected} <span className="text-[9px] uppercase font-bold text-gray-500 ml-0.5">{unitLabel}</span>
                                            {packDesc && <span className="text-[9px] font-mono text-teal-600 dark:text-teal-400 ml-1">({packDesc})</span>}
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
