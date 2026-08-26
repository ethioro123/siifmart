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
        setEditingId,
        editForm,
        setEditForm,
        getMargin,
        sites,
        products,
        handleSavePrice,
        setSelectedLocationProduct,
        setIsLocationModalOpen,
        handleEditClick,
        openProductControl
    } = useMerchandising();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                    <tr className="bg-[#FAF8F5] dark:bg-black/30 border-b border-[#E2DCCE]/60 dark:border-white/5 text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black tracking-widest">
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
                            className="p-4 cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={sortConfig.key === 'name' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}>Product</span>
                                {sortConfig.key === 'name' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Site/Location */}
                        <th
                            className="p-4 cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                            onClick={() => handleSort('siteId')}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={sortConfig.key === 'siteId' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}>Location</span>
                                {sortConfig.key === 'siteId' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Price */}
                        <th
                            className="p-4 cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('price')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'price' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}>Retail Price</span>
                                {sortConfig.key === 'price' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Competitor Price */}
                        <th
                            className="p-4 cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('competitorPrice')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'competitorPrice' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}>Competitor</span>
                                {sortConfig.key === 'competitorPrice' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Margin */}
                        <th
                            className="p-4 cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                            onClick={() => handleSort('margin')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'margin' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}>Margin</span>
                                {sortConfig.key === 'margin' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                )}
                            </div>
                        </th>
                        {/* Velocity */}
                        <th className="p-4 text-center">Velocity</th>
                        {/* Sale Active */}
                        <th className="p-4 text-center">Sale Status</th>
                        <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5">
                    {paginatedProducts.map(p => {
                        const isEditing = editingId === p.id;
                        const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                        const retail = isEditing ? editForm.price : p.price;
                        const margin = getMargin(retail, cost);
                        const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                        return (
                            <tr
                                key={p.id}
                                className={`hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition-colors ${
                                    selectedIds.has(p.id) ? 'bg-emerald-50/50 dark:bg-[#2C5E3B]/10' : ''
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
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center shrink-0 overflow-hidden">
                                            {p.image && !p.image.includes('placeholder.com') ? (
                                                <img
                                                    src={p.image}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={17} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openProductControl(p)}
                                                    className="text-xs font-black text-[#1E3F27] dark:text-white leading-none hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:underline transition-colors text-left cursor-pointer"
                                                >
                                                    {p.name}
                                                </button>
                                                {p.sku && (
                                                    <span className="text-[10px] bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/10 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300 font-mono font-bold">
                                                        {p.sku}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[11px] text-stone-500 dark:text-stone-400">{p.category}</p>
                                                {p.sku && products.filter(pi => pi.sku === p.sku).length > 1 && (
                                                    <span className="text-[10px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
                                                        <Map size={10} /> {products.filter(pi => pi.sku === p.sku).length} Locations
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Location */}
                                <td className="p-4 text-xs font-bold text-stone-600 dark:text-stone-300">
                                    {sites.find(s => s.id === p.siteId)?.name || 'Unknown Site'}
                                </td>

                                {/* Retail Price */}
                                <td className="p-4 text-right">
                                    {isEditing ? (
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase">Cost:</span>
                                                <input
                                                    type="number"
                                                    readOnly
                                                    disabled
                                                    className="w-24 bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2 py-1 text-right text-stone-400 font-mono text-xs outline-none cursor-not-allowed"
                                                    value={editForm.cost}
                                                    aria-label="Cost Price - Read-only from PO"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-stone-500 font-bold uppercase">Price:</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-[#FAF8F5] dark:bg-black/30 border border-[#2C5E3B] rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-white outline-none font-mono text-xs font-bold"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                    aria-label="Retail Price"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[#1E3F27] dark:text-white font-mono font-black text-xs">
                                                {CURRENCY_SYMBOL} {retail.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-stone-400 font-mono">Cost: {cost.toLocaleString()}</span>
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
                                                    compVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-[#A9CBA2]'
                                                }`}
                                            >
                                                {compVariance > 0 ? '+' : ''}
                                                {compVariance.toFixed(1)}% vs Mkt
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-stone-400 text-xs">-</span>
                                    )}
                                </td>

                                {/* Margin */}
                                <td className="p-4 text-right">
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                            margin < 15
                                                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                                                : margin > 40
                                                ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30'
                                        }`}
                                    >
                                        {margin.toFixed(1)}%
                                    </span>
                                </td>

                                {/* Sales Velocity */}
                                <td className="p-4 text-center">
                                    {p.salesVelocity === 'High' && (
                                        <span className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-bold flex justify-center items-center">
                                            <ChevronUp size={13} className="mr-0.5" /> High
                                        </span>
                                    )}
                                    {p.salesVelocity === 'Medium' && <span className="text-amber-700 dark:text-amber-300 text-xs font-bold">Medium</span>}
                                    {p.salesVelocity === 'Low' && <span className="text-red-600 dark:text-red-400 text-xs font-bold">Low</span>}
                                    {!p.salesVelocity && <span className="text-stone-400 text-xs">-</span>}
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
                                                    className="w-16 text-[10px] bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-lg text-center text-[#1E3F27] dark:text-white outline-none font-mono"
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
                                                <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900/30">
                                                    {CURRENCY_SYMBOL} {p.salePrice}
                                                </span>
                                            ) : (
                                                <span className="text-stone-400 text-xs">-</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Action Buttons */}
                                <td className="p-4 text-right pr-6">
                                    {isEditing ? (
                                        <div className="flex justify-end gap-1.5">
                                            <button
                                                onClick={() => handleSavePrice(p.id)}
                                                className="p-1.5 bg-emerald-50 text-[#2C5E3B] hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30 transition-colors cursor-pointer"
                                                title="Save Changes"
                                                aria-label="Save Changes"
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300 rounded-xl transition-colors cursor-pointer"
                                                title="Cancel"
                                                aria-label="Cancel"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1.5">
                                            <button
                                                onClick={() => openProductControl(p)}
                                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-[#2C5E3B]/20 text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] rounded-xl transition-colors cursor-pointer"
                                                title="Edit Product & Pricing"
                                                aria-label={`Edit pricing for ${p.name}`}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedLocationProduct(p);
                                                    setIsLocationModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-500 hover:text-amber-700 dark:hover:text-amber-300 rounded-xl transition-colors cursor-pointer"
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
