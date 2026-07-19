import React from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { getABCClass, getInventoryValue } from '../utils/inventoryHelpers';
import { getSellUnit } from '../../../utils/units';
import { useStore } from '../../../contexts/CentralStore';
import { canViewCostPrice } from '../../../utils/roles';

interface InventoryMobileListProps {
    products: Product[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    totalInventoryValue: number;
    toggleSelection: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    setSelectedViewProduct: (product: Product | null) => void;
}

export const InventoryMobileList: React.FC<InventoryMobileListProps> = ({
    products,
    selectedIds,
    setSelectedIds,
    sites,
    activeSite,
    isReadOnly,
    totalInventoryValue,
    toggleSelection,
    handleOpenAdjust,
    handleOpenEditProduct,
    handleDeleteProduct,
    setSelectedViewProduct
}) => {
    const { user } = useStore();
    const showCostPrice = canViewCostPrice(user?.role);

    return (

        <div className="block md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {products.map((product) => {
                const abc = getABCClass(product, totalInventoryValue);
                const isSelected = selectedIds.has(product.id);
                const unitDef = getSellUnit(product.unit || '');
                const sizeNum = parseFloat(product.size || '0');
                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;
                const stockVal = product.stock || 0;
                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                const isOutOfStock = stockVal === 0;
                const isLowStock = stockVal < threshold;
                const colorClasses = isOutOfStock
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : isLowStock
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                    : 'bg-green-500/10 text-green-500 border border-green-500/30';

                return (
                    <div
                        key={product.id}
                        onClick={() => setSelectedViewProduct(product)}
                        className={`p-4 space-y-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all cursor-pointer ${isSelected ? 'bg-[#2C5E3B]/[0.08] dark:bg-[#A9CBA2]/[0.08]' : ''}`}
                    >
                        {/* Top Row: Select, Name, SKU, Image */}
                        <div className="flex items-start gap-3">
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        aria-label="Select row"
                                        className="peer appearance-none w-4 h-4 border border-white/10 rounded bg-white/5 checked:bg-[#2C5E3B] checked:border-[#2C5E3B] dark:checked:bg-[#A9CBA2] dark:checked:border-[#A9CBA2] transition-all cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(product.id)}
                                    />
                                    <CheckCircle size={10} className="absolute text-black dark:text-[#18201B] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {product.image && !product.image.includes('placeholder.com') ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={20} className="text-gray-700" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] truncate uppercase">
                                    {product.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <span className="text-[8px] font-extrabold font-mono text-[#2C5E3B] bg-[#2C5E3B]/10 dark:text-[#A9CBA2] dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded">
                                        {product.sku}
                                    </span>
                                    <span className="text-[8px] font-extrabold text-stone-600 bg-stone-100 dark:text-[#7A9E83] dark:bg-white/5 px-1.5 py-0.5 rounded">
                                        {product.category}
                                    </span>
                                </div>
                            </div>
                            {/* Status Badge */}
                            <div className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg ${colorClasses}`}>
                                {stockVal}
                                {isWeightVol ? ` × ${sizeNum}${unitDef.shortLabel.toLowerCase()}` : ` ${unitDef.shortLabel}`}
                            </div>
                        </div>

                        {/* Middle details: Location, Price, Total Value */}
                        <div className={`grid ${showCostPrice ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-left bg-[#FAF8F5] dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5`}>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Location</span>
                                {(() => {
                                    const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                    return (
                                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold truncate mt-0.5">
                                            {site ? site.name : product.location || 'No Loc'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Price</span>
                                <span className="text-[10px] text-gray-900 dark:text-white font-mono font-bold mt-0.5">
                                    {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL }) : '—'}
                                </span>
                            </div>
                            {showCostPrice && (
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Cost</span>
                                    <span className="text-[10px] text-gray-900 dark:text-white font-mono font-bold mt-0.5">
                                        {product.costPrice && product.costPrice > 0 ? formatCompactNumber(product.costPrice, { currency: CURRENCY_SYMBOL }) : '—'}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Value</span>
                                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-bold mt-0.5">
                                    {product.price && product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: CURRENCY_SYMBOL }) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom row: Actions & date */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-gray-500 font-mono">
                                {(() => {
                                    const dateVal = product.createdAt || (product as any).created_at;
                                    if (!dateVal) return '--';
                                    return new Date(dateVal).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric'
                                    });
                                })()}
                            </span>
                            {!isReadOnly && (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleOpenAdjust(product)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/10 dark:hover:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] rounded-lg transition-all"
                                    >
                                        Adjust
                                    </button>
                                    <button
                                        onClick={() => handleOpenEditProduct(product)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
export default InventoryMobileList;
