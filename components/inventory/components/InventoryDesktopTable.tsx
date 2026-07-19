import React from 'react';
import {
    ArrowUpDown, CheckCircle, Package, RefreshCw, Edit, Trash2
} from 'lucide-react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { getABCClass, getInventoryValue, LocationDropdown } from '../utils/inventoryHelpers';
import { getSellUnit } from '../../../utils/units';
import { CompactLocationDisplay } from '../../ProductLocationDisplay';
import { Protected } from '../../Protected';
import { useStore } from '../../../contexts/CentralStore';
import { canViewCostPrice } from '../../../utils/roles';

interface InventoryDesktopTableProps {
    products: Product[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    handleSort: (key: string) => void;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    totalInventoryValue: number;
    getOtherLocationsForSku: (sku: string, id: string, siteId?: string) => any;
    toggleSelection: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    setSelectedViewProduct: (product: Product | null) => void;
}

export const InventoryDesktopTable: React.FC<InventoryDesktopTableProps> = ({
    products,
    selectedIds,
    setSelectedIds,
    sortConfig,
    handleSort,
    sites,
    activeSite,
    isReadOnly,
    totalInventoryValue,
    getOtherLocationsForSku,
    toggleSelection,
    handleOpenAdjust,
    handleOpenEditProduct,
    handleDeleteProduct,
    setSelectedViewProduct
}) => {
    const { user } = useStore();
    const showCostPrice = canViewCostPrice(user?.role);

    return (
        <table className="w-full text-left border-collapse hidden md:table">
            <thead className="sticky top-0 bg-gray-50/95 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-white/10 shadow-sm">
                <tr className="bg-gray-50 dark:bg-white/[0.02]">
                    <th className="p-5 w-10">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                aria-label="Select All"
                                className="peer appearance-none w-4 h-4 border border-white/20 dark:border-white/20 rounded bg-white/5 checked:bg-[#2C5E3B] checked:border-[#2C5E3B] dark:checked:bg-[#A9CBA2] dark:checked:border-[#A9CBA2] transition-all cursor-pointer"
                                onChange={() => {
                                    if (selectedIds.size === products.length) setSelectedIds(new Set());
                                    else setSelectedIds(new Set(products.map(i => i.id)));
                                }}
                                checked={selectedIds.size === products.length && products.length > 0}
                            />
                            <CheckCircle size={10} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </th>

                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-2">
                            Product
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'name' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('location')}>
                        <div className="flex items-center gap-2">
                            Location
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'location' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'location' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('stock')}>
                        <div className="flex items-center justify-center gap-2">
                            Stock Level
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'stock' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'stock' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('unit')}>
                        <div className="flex items-center justify-center gap-2">
                            Unit
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'unit' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'unit' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>

                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('price')}>
                        <div className="flex items-center justify-end gap-2">
                            Price
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'price' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    {showCostPrice && (
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('costPrice')}>
                            <div className="flex items-center justify-end gap-2">
                                Cost Price
                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'costPrice' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                    <ArrowUpDown size={10} className={sortConfig?.key === 'costPrice' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                </div>
                            </div>
                        </th>
                    )}
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('assetValue')}>
                        <div className="flex items-center justify-end gap-2">
                            Value
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'assetValue' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'assetValue' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('abc')}>
                        <div className="flex items-center justify-center gap-2">
                            Class
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'abc' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'abc' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center justify-end gap-2">
                            Date
                            <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'createdAt' ? 'bg-[#2C5E3B]/20 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                <ArrowUpDown size={10} className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((product) => {
                    const abc = getABCClass(product, totalInventoryValue);
                    const isSelected = selectedIds.has(product.id);

                    return (
                        <tr
                            key={product.id}
                            onClick={() => setSelectedViewProduct(product)}
                            className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-300 cursor-pointer ${isSelected ? 'bg-[#2C5E3B]/[0.08] dark:bg-[#A9CBA2]/[0.08]' : ''}`}
                        >
                            <td className="p-5" onClick={(e) => e.stopPropagation()}>
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
                            </td>
                            <td className="p-5">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-[#2C5E3B]/30 dark:group-hover:border-[#A9CBA2]/30 transition-colors">
                                        {product.image && !product.image.includes('placeholder.com') ? (
                                            <img
                                                src={product.image}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <Package size={24} className="text-gray-700 group-hover:text-[#2C5E3B]/40 dark:group-hover:text-[#A9CBA2]/40 transition-colors" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors duration-200 uppercase">
                                            {product.name}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 max-w-md">
                                            {product.brand && !product.name.toLowerCase().startsWith(product.brand.toLowerCase()) && (
                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-500/5 dark:text-amber-400 dark:bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 dark:border-amber-500/10 uppercase tracking-wider">
                                                    {product.brand}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-extrabold font-mono text-[#2C5E3B] bg-[#2C5E3B]/10 dark:text-[#A9CBA2] dark:bg-[#A9CBA2]/10 px-2 py-0.5 rounded border border-[#2C5E3B]/25 dark:border-[#A9CBA2]/25 uppercase tracking-tighter shadow-sm">
                                                {product.sku}
                                            </span>
                                            <span className="text-[9px] font-extrabold text-stone-600 bg-stone-100 dark:text-stone-300 dark:bg-white/5 px-2 py-0.5 rounded border border-stone-200 dark:border-white/5 uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                            {product.approvalStatus === 'pending' && (
                                                <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider shadow-sm animate-pulse">
                                                    ⏳ Review
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                {(!activeSite || isReadOnly) ? (
                                    (() => {
                                        const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                        const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);

                                        if (site) {
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        {site.name}
                                                    </span>
                                                    <span className="text-[9px] text-gray-600 font-bold uppercase mt-0.5 ml-3">{site.type}</span>
                                                    {otherLocs.count > 0 && (
                                                        <div className="ml-3">
                                                            <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            return product.location ? (
                                                <div className="flex flex-col gap-1">
                                                    <CompactLocationDisplay product={product} sites={sites} />
                                                    <span className="text-[9px] text-red-400/60 font-medium uppercase mt-1 ml-1 w-full truncate">Unmapped Site</span>
                                                    {otherLocs.count > 0 && (
                                                        <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-600 font-black uppercase italic tracking-widest">Unmapped Site (No Loc)</span>
                                            );
                                        }
                                    })()
                                ) : (
                                    (() => {
                                        const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);
                                        return product.location ? (
                                            <div className="flex flex-col gap-1">
                                                <CompactLocationDisplay product={product} sites={sites} />
                                                {otherLocs.count > 0 && (
                                                    <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10">No Cell Assigned</span>
                                        );
                                    })()
                                )}
                            </td>
                            <td className="p-5 text-center">
                                {(() => {
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
                                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/5'
                                        : 'bg-green-500/10 text-green-500 border border-green-500/30';
                                    return (
                                        <div className={`inline-flex items-center justify-center min-w-[50px] px-3 py-1.5 rounded-2xl text-[12px] font-black font-mono shadow-sm transition-all ${colorClasses}`}>
                                            {stockVal.toLocaleString()}
                                            {isWeightVol ? (
                                                <span className="text-[9px] font-bold ml-1 opacity-60">× {sizeNum}{unitDef.shortLabel.toLowerCase()}</span>
                                            ) : unitDef.code !== 'UNIT' ? (
                                                <span className="text-[9px] font-bold ml-1 uppercase opacity-60">{unitDef.shortLabel}</span>
                                            ) : null}
                                        </div>
                                    );
                                })()}
                            </td>
                            <td className="p-5 text-center">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                                    {product.unit || 'UNIT'}
                                </span>
                            </td>

                            <td className="p-5 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-black text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                        {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL }) : '—'}
                                        {product.unit && product.price > 0 && getSellUnit(product.unit).code !== 'UNIT' && (
                                            <span className="text-[9px] text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span>
                                        )}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Retail Price</span>
                                </div>
                            </td>
                            {showCostPrice && (
                                <td className="p-5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[13px] font-black text-gray-900 dark:text-white font-mono tracking-tighter group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                            {product.costPrice && product.costPrice > 0 ? formatCompactNumber(product.costPrice, { currency: CURRENCY_SYMBOL }) : '—'}
                                            {product.costPrice !== undefined && product.costPrice !== null && product.costPrice > 0 && getSellUnit(product.unit || '').code !== 'UNIT' && (
                                                <span className="text-[9px] text-gray-500 font-bold">/{getSellUnit(product.unit || '').shortLabel}</span>
                                            )}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Cost Price</span>
                                    </div>
                                </td>
                            )}
                            <td className="p-5 text-right">
                                <div className="inline-flex flex-col items-end bg-gray-100 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-white/[0.03]">
                                    <span className="text-[12px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-tighter">
                                        {product.price && product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: CURRENCY_SYMBOL }) : '—'}
                                    </span>
                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest font-sans">Inventory Value</span>
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black border transition-all ${abc === 'A' ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-lg shadow-green-500/5' : abc === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                                    {abc}
                                </div>
                            </td>
                            <td className="p-5 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-gray-500 font-mono">
                                        {(() => {
                                            const dateVal = product.createdAt || (product as any).created_at;
                                            if (!dateVal) return '--';
                                            return new Date(dateVal).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric',
                                                hour: 'numeric', minute: '2-digit'
                                            }).replace(',', ' •');
                                        })()}
                                    </span>
                                    <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">Date Added</span>
                                </div>
                            </td>
                            <td className="p-5 text-right">
                                {!isReadOnly && (
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                                        <Protected permission="EDIT_PRODUCT">
                                            <div className="flex items-center gap-1">
                                                <Protected permission="ADJUST_STOCK">
                                                    <button
                                                        onClick={() => handleOpenAdjust(product)}
                                                        className="p-2 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] text-gray-500 rounded-xl transition-all"
                                                        title="Adjust Stock"
                                                    >
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </Protected>
                                                <button
                                                    onClick={() => handleOpenEditProduct(product)}
                                                    className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-gray-500 rounded-xl transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 text-gray-500 rounded-xl transition-all"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </Protected>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
