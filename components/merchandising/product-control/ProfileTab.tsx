import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { getSellUnit } from '../../../utils/units';

interface Props {
    product: Product;
}

export const ProfileTab: React.FC<Props> = ({ product }) => {
    const unitDef = getSellUnit(product.unit);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">SKU</p>
                    <p className="text-sm font-black font-mono text-gray-900 dark:text-white mt-0.5">{product.sku}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Barcode</p>
                    <p className="text-sm font-black font-mono text-gray-900 dark:text-white mt-0.5">{product.barcode || '—'}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Brand / Manufacturer</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{product.brand || '—'}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Category</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{product.category}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Current Stock</p>
                    <p className="text-sm font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">{product.stock} {unitDef.shortLabel}</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Retail Price</p>
                    <p className="text-sm font-black font-mono text-gray-900 dark:text-white mt-0.5">{CURRENCY_SYMBOL}{product.price}</p>
                </div>
            </div>

            {product.description && (
                <div className="p-3 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Description</p>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">{product.description}</p>
                </div>
            )}
        </div>
    );
};
