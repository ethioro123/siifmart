import React from 'react';
import {
    ChevronUp, ChevronDown, Package, Map, Edit2, Save, Trash2, XCircle
} from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const PricingProductsTable: React.FC = () => {
    const {
        selectedIds,
        toggleSelectAll,
        toggleSelection,
        sortConfig,
        handleSort,
        filteredProducts,
        currentPage,
        itemsPerPage,
        editingId,
        editForm,
        setEditForm,
        getMargin,
        sites,
        products,
        handleSavePrice,
        setSelectedLocationProduct,
        setIsLocationModalOpen,
        handleEditClick
    } = useMerchandising();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400">
                        <th className="p-4 text-center w-12">
                            <input
                                type="checkbox"
                                className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                                aria-label="Select all products"
                                checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        {/* Product Name */}
                        <th
                            className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-2">
                                <span className={sortConfig.key === 'name' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Product</span>
                                {sortConfig.key === 'name' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Site/Location */}
                        <th
                            className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            onClick={() => handleSort('siteId')}
                        >
                            <div className="flex items-center gap-2">
                                <span className={sortConfig.key === 'siteId' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Location</span>
                                {sortConfig.key === 'siteId' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Price */}
                        <th
                            className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('price')}
                        >
                            <div className="flex items-center justify-end gap-2">
                                <span className={sortConfig.key === 'price' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Retail Price</span>
                                {sortConfig.key === 'price' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Competitor Price */}
                        <th
                            className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('competitorPrice')}
                        >
                            <div className="flex items-center justify-end gap-2">
                                <span className={sortConfig.key === 'competitorPrice' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Competitor</span>
                                {sortConfig.key === 'competitorPrice' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Margin */}
                        <th
                            className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('margin')}
                        >
                            <div className="flex items-center justify-end gap-2">
                                <span className={sortConfig.key === 'margin' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Margin</span>
                                {sortConfig.key === 'margin' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Velocity */}
                        <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Velocity</th>
                        {/* Sale Active */}
                        <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Sale Active</th>
                        <th className="p-4 text-xs text-stone-500 uppercase text-right border-r-0 font-bold">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                    {paginatedProducts.map(p => {
                        const isEditing = editingId === p.id;
                        const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                        const retail = isEditing ? editForm.price : p.price;
                        const margin = getMargin(retail, cost);
                        const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                        return (
                            <tr
                                key={p.id}
                                className={`hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.04] ${
                                    selectedIds.has(p.id) ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5' : ''
                                }`}
                            >
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(p.id)}
                                        onChange={() => toggleSelection(p.id)}
                                        className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                                        aria-label={`Select ${p.name}`}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {p.image && !p.image.includes('placeholder.com') ? (
                                                <img
                                                    src={p.image}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML =
                                                            '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={18} className="text-stone-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-[#1E3F27] dark:text-white leading-none">{p.name}</p>
                                                {p.sku && (
                                                    <span className="text-[10px] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-1.5 py-0.5 rounded text-[#2C5E3B] dark:text-[#A9CBA2] font-mono uppercase tracking-wider">
                                                        {p.sku}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-stone-500 dark:text-stone-400">{p.category}</p>
                                                {p.sku && products.filter(pi => pi.sku === p.sku).length > 1 && (
                                                    <span className="text-[10px] text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Map size={10} /> {products.filter(pi => pi.sku === p.sku).length} Locations
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Location */}
                                <td className="p-4 text-sm text-stone-600 dark:text-stone-400">{sites.find(s => s.id === p.siteId)?.name || 'Unknown Site'}</td>

                                {/* Retail Price */}
                                <td className="p-4 text-right">
                                    {isEditing ? (
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price:</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                    aria-label="Retail Price"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Cost:</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                                    value={editForm.cost}
                                                    onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                                                    aria-label="Cost Price"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[#1E3F27] dark:text-white font-mono font-bold">
                                                {CURRENCY_SYMBOL} {retail.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-stone-500 font-mono">Cost: {cost.toLocaleString()}</span>
                                        </div>
                                    )}
                                </td>

                                {/* Competitor Analysis */}
                                <td className="p-4 text-right">
                                    {p.competitorPrice ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                                                {CURRENCY_SYMBOL} {p.competitorPrice.toLocaleString()}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold ${
                                                    compVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                }`}
                                            >
                                                {compVariance > 0 ? '+' : ''}
                                                {compVariance.toFixed(1)}% vs Mkt
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-stone-400 dark:text-stone-600 text-xs">-</span>
                                    )}
                                </td>

                                {/* Margin */}
                                <td className="p-4 text-right">
                                    <span
                                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                            margin < 15
                                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                : margin > 40
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                        }`}
                                    >
                                        {margin.toFixed(1)}%
                                    </span>
                                </td>

                                {/* Sales Velocity */}
                                <td className="p-4 text-center">
                                    {p.salesVelocity === 'High' && (
                                        <span className="text-green-600 dark:text-green-400 text-xs font-bold flex justify-center items-center">
                                            <ChevronUp size={12} className="mr-1" /> High
                                        </span>
                                    )}
                                    {p.salesVelocity === 'Medium' && <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">Medium</span>}
                                    {p.salesVelocity === 'Low' && <span className="text-red-600 dark:text-red-400 text-xs font-bold">Low</span>}
                                </td>

                                {/* Is On Sale Toggle */}
                                <td className="p-4 text-center">
                                    {isEditing ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isOnSale}
                                                onChange={(e) => setEditForm({ ...editForm, isOnSale: e.target.checked })}
                                                className="w-4 h-4 accent-[#2C5E3B] dark:accent-[#A9CBA2] cursor-pointer"
                                                aria-label="Toggle Sale Status"
                                            />
                                            {editForm.isOnSale && (
                                                <input
                                                    type="number"
                                                    className="w-16 text-[10px] bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded text-center text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono"
                                                    value={editForm.salePrice}
                                                    onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })}
                                                    placeholder="Promo"
                                                    aria-label="Promo Sale Price"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex justify-center">
                                            {p.isOnSale ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                                                    {CURRENCY_SYMBOL} {p.salePrice}
                                                </span>
                                            ) : (
                                                <span className="text-stone-400 dark:text-stone-600 text-xs">-</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Action Buttons */}
                                <td className="p-4 text-right">
                                    {isEditing ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleSavePrice}
                                                className="p-1.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                                                title="Save Changes"
                                                aria-label="Save Changes"
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg transition-all"
                                                title="Cancel"
                                                aria-label="Cancel"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(p)}
                                                className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white rounded-lg transition-all"
                                                title="Edit pricing"
                                                aria-label={`Edit pricing for ${p.name}`}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedLocationProduct(p);
                                                    setIsLocationModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-blue-500 rounded-lg transition-all"
                                                title="View/Distribute Stock across locations"
                                                aria-label="View stock distribution"
                                            >
                                                <Map size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
