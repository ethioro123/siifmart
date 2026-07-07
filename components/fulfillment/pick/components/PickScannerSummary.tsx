import React from 'react';
import { WMSJob, Product } from '../../../../types';

interface PickScannerSummaryProps {
    job: WMSJob;
    getProduct: (item: any) => Product | undefined;
    getItemMeasureQty: (item: any, prod?: Product | null) => number | null;
    t: (key: string) => string;
}

export const PickScannerSummary: React.FC<PickScannerSummaryProps> = ({
    job,
    getProduct,
    getItemMeasureQty,
    t,
}) => {
    return (
        <div className="text-center z-10 mb-8 bg-green-50 dark:bg-green-500/10 border-2 border-green-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.1)] w-full max-w-md">
            <p className="text-green-700 dark:text-green-400 text-lg font-bold uppercase tracking-widest mb-4">{t('warehouse.picking.allItemsPicked')}</p>

            <div className="bg-white dark:bg-black/40 rounded-xl p-4 mb-4 text-left max-h-48 overflow-y-auto border border-gray-200 dark:border-green-500/20 shadow-inner dark:shadow-none">
                <h4 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-gray-200 dark:border-white/10 pb-2">{t('warehouse.picking.missionSummary')}</h4>
                <div className="flex flex-col gap-3">
                    {job.lineItems?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-900 dark:text-white text-sm font-bold line-clamp-1">{item.name}</p>
                                <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-mono">{item.sku}</p>
                            </div>
                            {(() => {
                                let expected = item.expectedQty || item.quantity || 1;
                                let picked = item.pickedQty || item.quantity || 1;

                                const measureQty = getItemMeasureQty(item);
                                if (measureQty) {
                                    const prod = getProduct(item);
                                    const unitDef = prod?.unit ? prod.unit : '';
                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                    const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                    return <span className="text-gray-900 dark:text-white font-bold">{displayPickedCases} x {sizeNum} / {expected} x {sizeNum} <span className="text-[9px] lowercase opacity-80 pl-0.5">{unitDef}</span></span>;
                                }

                                return <span className="text-gray-900 dark:text-white font-bold">{picked} / {expected}</span>;
                            })()}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-gray-600 dark:text-white text-sm opacity-80 max-w-[200px] mx-auto">{t('warehouse.picking.finalizeMissionInfo')}</p>
        </div>
    );
};
