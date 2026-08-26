import React from 'react';
import { CheckCircle, PackageCheck, MapPin, ArrowRight } from 'lucide-react';
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
        <div className="w-full max-w-lg mx-auto z-10 my-2 space-y-4 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Top Success Badge */}
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-3">
                    <PackageCheck size={36} className="animate-bounce" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white uppercase italic tracking-tight">
                    {t('warehouse.picking.missionComplete') || 'Mission Complete'}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-1">
                    {totalItems} {totalItems === 1 ? 'Product' : 'Products'} Successfully Picked
                </p>
            </div>

            {/* Detailed Picked Items Card */}
            <div className="bg-white/95 dark:bg-[#18201B]/90 rounded-3xl p-4 sm:p-5 border border-[#E2DCCE] dark:border-[#2C5E3B]/20 shadow-md text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500">
                        {t('warehouse.picking.missionSummary') || 'Picked Inventory Items'}
                    </span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
                                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate uppercase">
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded border border-[#2C5E3B]/15 uppercase">
                                            {item.sku}
                                        </span>
                                        {loc && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-stone-500 dark:text-stone-400">
                                                <MapPin size={9} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                {loc}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                                            {picked} / {expected}
                                        </span>
                                        <span className="text-[9px] font-mono font-bold text-stone-400 uppercase">
                                            {unitText}
                                        </span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Subtext info */}
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium max-w-sm mx-auto leading-relaxed">
                {t('warehouse.picking.finalizeMissionInfo') || 'Click below to finalize this mission and create the Packing job.'}
            </p>
        </div>
    );
};
