import React from 'react';
import { CheckCircle } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { getSellUnit } from '../../../../utils/units';

interface PickScannerSummaryProps {
    job: WMSJob;
    getProduct: (item: any) => Product | undefined;
    getItemMeasureQty: (item: any, prod?: Product | null) => number | null;
    t: (key: string) => string;
}

export const PickScannerSummary: React.FC<PickScannerSummaryProps> = ({
    job,
    getProduct,
    t,
}) => {
    const totalItems = job.lineItems?.length || 0;

    return (
        <div className="text-center z-10 my-4 bg-gradient-to-b from-green-500/10 to-emerald-500/5 dark:from-green-500/15 dark:to-emerald-950/20 border border-green-500/30 p-5 rounded-3xl shadow-xl w-full max-w-md backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-3 border border-green-500/30 shadow-inner">
                <CheckCircle size={26} />
            </div>
            <h3 className="text-green-700 dark:text-green-400 text-base font-black uppercase tracking-wider mb-0.5">{t('warehouse.picking.allItemsPicked')}</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mb-4">{totalItems} {totalItems === 1 ? 'Product' : 'Products'} Picked</p>

            <div className="bg-white/90 dark:bg-black/50 rounded-2xl p-3.5 mb-4 text-left max-h-56 overflow-y-auto border border-stone-200 dark:border-white/10 shadow-sm space-y-2 custom-scrollbar">
                <h4 className="text-stone-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest pb-1 border-b border-stone-200/50 dark:border-white/5">{t('warehouse.picking.missionSummary')}</h4>
                <div className="space-y-1.5">
                    {job.lineItems?.map((item: any, idx: number) => {
                        const prod = getProduct(item);
                        let expected = item.expectedQty || item.quantity || 1;
                        let picked = item.pickedQty || item.quantity || 1;
                        const unitDef = getSellUnit(prod?.unit || item.unit);
                        const sizeStr = prod?.size || item.size;
                        const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                        const unitText = isWeightVol ? `packs (${sizeStr}${unitDef.shortLabel})` : unitDef.code !== 'UNIT' ? unitDef.shortLabel : '';

                        return (
                            <div key={idx} className="flex justify-between items-center bg-stone-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-stone-200/50 dark:border-white/5 gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-gray-900 dark:text-white text-xs font-bold truncate uppercase">{item.name}</p>
                                    <span className="text-[#2C5E3B] dark:text-[#A9CBA2] text-[9px] font-mono font-bold bg-stone-200/40 dark:bg-black/30 px-1 rounded">{item.sku}</span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-gray-900 dark:text-white font-mono font-black text-xs">
                                        {picked} / {expected} <span className="text-[9px] text-gray-500 font-bold uppercase ml-0.5">{unitText}</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-xs font-medium max-w-[260px] mx-auto leading-relaxed">{t('warehouse.picking.finalizeMissionInfo')}</p>
        </div>
    );
};
