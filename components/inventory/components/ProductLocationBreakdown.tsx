import React from 'react';
import { Building2 } from 'lucide-react';
import { Product } from '../../../types';
import { formatStockDisplay } from '../../../utils/units';

interface LocationBreakdownItem {
    id: string;
    siteName: string;
    location: string;
    stock: number;
    price: number;
    minStock?: number;
    isCurrentSite: boolean;
}

interface Props {
    product: Product;
    locationBreakdown: LocationBreakdownItem[];
}

export const ProductLocationBreakdown: React.FC<Props> = ({ product, locationBreakdown }) => {
    if (!locationBreakdown || locationBreakdown.length === 0) return null;

    const totalStockSum = locationBreakdown.reduce((sum, l) => sum + l.stock, 0);
    const formattedTotal = formatStockDisplay(totalStockSum, product);

    return (
        <div className="bg-white dark:bg-black/15 p-5 rounded-2xl border border-stone-200 dark:border-white/5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider">Multi-Site & Store Stock Breakdown</h3>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                    {formattedTotal} Across {locationBreakdown.length} {locationBreakdown.length === 1 ? 'Location' : 'Locations'}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {locationBreakdown.map((loc, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                            loc.isCurrentSite
                                ? 'bg-[#2C5E3B]/5 border-[#2C5E3B]/20 dark:bg-[#A9CBA2]/10 dark:border-[#A9CBA2]/20'
                                : 'bg-stone-50/50 dark:bg-black/10 border-stone-200/50 dark:border-white/5'
                        }`}
                    >
                        <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-900 dark:text-white truncate">{loc.siteName}</span>
                                {loc.isCurrentSite && (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#2C5E3B] text-white">This Store</span>
                                )}
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 mt-0.5 truncate">Shelf / Bin: {loc.location}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={`text-xs font-black font-mono ${loc.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {formatStockDisplay(loc.stock, product)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
