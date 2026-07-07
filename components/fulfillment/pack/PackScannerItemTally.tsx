import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PackScannerItemTallyProps {
    packedItems: any[];
    totalItems: number;
    getItemMeasureQty: (item: any, product?: Product | null) => number | null;
    getProduct: (item: any) => Product | undefined;
}

export const PackScannerItemTally: React.FC<PackScannerItemTallyProps> = ({
    packedItems,
    totalItems,
    getItemMeasureQty,
    getProduct,
}) => {
    const { t } = useLanguage();

    if (packedItems.length === 0) return null;

    return (
        <div className="w-full max-w-md mt-6 z-10">
            <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <CheckCircle size={10} className="text-green-500" />
                    {t('warehouse.picking')}
                </h4>
                <span className="text-[10px] font-mono font-black text-green-600 dark:text-green-500/60 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    {packedItems.length}/{totalItems}
                </span>
            </div>
            <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-inner">
                {packedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0 mr-3">
                            <p className="text-gray-900 dark:text-white text-sm font-bold truncate">{item.name}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-mono">{item.sku}</p>
                        </div>
                        <span className="bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-mono font-black px-2 py-1 rounded-lg border border-green-500/20 whitespace-nowrap">
                            {(() => {
                                const expected = item.expectedQty || 1;
                                const picked = item.pickedQty || 0;
                                const measureQty = getItemMeasureQty(item);
                                if (measureQty !== null && measureQty !== undefined) {
                                    const prod = getProduct(item);
                                    const sizeNum = prod?.size ? parseFloat(prod.size as string) : 0;
                                    const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                    return <>{displayPickedCases} x {sizeNum} / {expected} x {sizeNum}</>;
                                }
                                return <>{picked} / {expected}</>;
                            })()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackScannerItemTally;
