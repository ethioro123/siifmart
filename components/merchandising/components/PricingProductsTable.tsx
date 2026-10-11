import React from 'react';
import {
    ChevronUp, ChevronDown, Package, Map, Edit2, Save, Trash2, XCircle
} from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';

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
        openProductControl,
        currencySymbol
    } = useMerchandising();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                    <tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">
                        <th className="p-4 text-center w-12">
                            <input
                                type="checkbox"
                                className="accent-[var(--theme-accent)] w-4 h-4 cursor-pointer rounded"
                                aria-label="Select all products"
                                checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        {/* Product Name */}
                        <th
                            className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={sortConfig.key === 'name' ? 'text-[var(--theme-accent)]' : ''}>Product</span>
                                {sortConfig.key === 'name' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[var(--theme-accent)]" /> : <ChevronDown size={13} className="text-[var(--theme-accent)]" />
                                )}
                            </div>
                        </th>
                        {/* Site/Location */}
                        <th
                            className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors"
                            onClick={() => handleSort('siteId')}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={sortConfig.key === 'siteId' ? 'text-[var(--theme-accent)]' : ''}>Location</span>
                                {sortConfig.key === 'siteId' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[var(--theme-accent)]" /> : <ChevronDown size={13} className="text-[var(--theme-accent)]" />
                                )}
                            </div>
                        </th>
                        {/* Price */}
                        <th
                            className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors text-right"
                            onClick={() => handleSort('price')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'price' ? 'text-[var(--theme-accent)]' : ''}>Retail Price</span>
                                {sortConfig.key === 'price' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[var(--theme-accent)]" /> : <ChevronDown size={13} className="text-[var(--theme-accent)]" />
                                )}
                            </div>
                        </th>
                        {/* Competitor Price */}
                        <th
                            className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors text-right"
                            onClick={() => handleSort('competitorPrice')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'competitorPrice' ? 'text-[var(--theme-accent)]' : ''}>Competitor</span>
                                {sortConfig.key === 'competitorPrice' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[var(--theme-accent)]" /> : <ChevronDown size={13} className="text-[var(--theme-accent)]" />
                                )}
                            </div>
                        </th>
                        {/* Margin */}
                        <th
                            className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors text-right"
                            onClick={() => handleSort('margin')}
                        >
                            <div className="flex items-center justify-end gap-1.5">
                                <span className={sortConfig.key === 'margin' ? 'text-[var(--theme-accent)]' : ''}>Margin</span>
                                {sortConfig.key === 'margin' && (
                                    sortConfig.direction === 'asc' ? <ChevronUp size={13} className="text-[var(--theme-accent)]" /> : <ChevronDown size={13} className="text-[var(--theme-accent)]" />
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
                <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                    {paginatedProducts.map(p => {
                        const isEditing = editingId === p.id;
                        const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                        const retail = isEditing ? editForm.price : p.price;
                        const margin = getMargin(retail, cost);
                        const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                        return (
                            <tr
                                key={p.id}
                                className={`hover:bg-[var(--theme-bg-subtle)] transition-colors ${
                                    selectedIds.has(p.id) ? 'bg-[var(--theme-accent)]/5' : ''
                                }`}
                            >
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(p.id)}
                                        onChange={() => toggleSelection(p.id)}
                                        className="accent-[var(--theme-accent)] w-4 h-4 cursor-pointer rounded"
                                        aria-label={`Select ${p.name}`}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
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
                                                <Package size={16} className="text-[var(--theme-text-secondary)]" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openProductControl(p)}
                                                    className="text-xs font-semibold text-[var(--theme-text-primary)] leading-tight hover:text-[var(--theme-accent)] transition-colors text-left cursor-pointer"
                                                >
                                                    {p.name}
                                                </button>
                                                {p.sku && (
                                                    <span className="text-[10px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded font-mono font-medium text-[var(--theme-text-secondary)]">
                                                        {p.sku}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[11px] text-[var(--theme-text-secondary)]">{p.category}</p>
                                                {p.sku && products.filter(pi => pi.sku === p.sku).length > 1 && (
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                                        <Map size={10} /> {products.filter(pi => pi.sku === p.sku).length} Locations
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Location */}
                                <td className="p-4 text-xs font-medium text-[var(--theme-text-primary)]">
                                    {sites.find(s => s.id === p.siteId)?.name || 'Unknown Site'}
                                </td>

                                {/* Retail Price */}
                                <td className="p-4 text-right">
                                    {isEditing ? (
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium uppercase">Cost:</span>
                                                <input
                                                    type="number"
                                                    readOnly
                                                    disabled
                                                    className="w-24 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1 text-right text-[var(--theme-text-secondary)] font-mono text-xs outline-none cursor-not-allowed tabular-nums"
                                                    value={editForm.cost}
                                                    aria-label="Cost Price - Read-only from PO"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[var(--theme-text-primary)] font-medium uppercase">Price:</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-[var(--theme-bg-card)] border border-[var(--theme-accent)] rounded-xl px-2 py-1 text-right text-[var(--theme-text-primary)] outline-none font-mono text-xs font-semibold tabular-nums focus:ring-1 focus:ring-[var(--theme-accent)]"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                    aria-label="Retail Price"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[var(--theme-text-primary)] font-mono font-semibold text-xs tabular-nums">
                                                {currencySymbol} {retail.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono tabular-nums">Cost: {cost.toLocaleString()}</span>
                                        </div>
                                    )}
                                </td>

                                {/* Competitor Analysis */}
                                <td className="p-4 text-right">
                                    {p.competitorPrice ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[var(--theme-text-primary)] font-mono text-xs tabular-nums">
                                                {currencySymbol} {p.competitorPrice.toLocaleString()}
                                            </span>
                                            <span
                                                className={`text-[10px] font-mono font-medium tabular-nums ${
                                                    compVariance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {compVariance > 0 ? '+' : ''}
                                                {compVariance.toFixed(1)}% vs Mkt
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[var(--theme-text-tertiary)] text-xs">-</span>
                                    )}
                                </td>

                                {/* Margin */}
                                <td className="p-4 text-right">
                                    <span
                                        className={`text-xs font-mono font-medium tabular-nums px-2 py-0.5 rounded-lg border ${
                                            margin < 15
                                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                : margin > 40
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        }`}
                                    >
                                        {margin.toFixed(1)}%
                                    </span>
                                </td>

                                {/* Sales Velocity */}
                                <td className="p-4 text-center">
                                    {p.salesVelocity === 'High' && (
                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex justify-center items-center gap-0.5">
                                            <ChevronUp size={13} /> High
                                        </span>
                                    )}
                                    {p.salesVelocity === 'Medium' && <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Medium</span>}
                                    {p.salesVelocity === 'Low' && <span className="text-rose-600 dark:text-rose-400 text-xs font-medium">Low</span>}
                                    {!p.salesVelocity && <span className="text-[var(--theme-text-tertiary)] text-xs">-</span>}
                                </td>

                                {/* Is On Sale Toggle */}
                                <td className="p-4 text-center">
                                    {isEditing ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isOnSale}
                                                onChange={(e) => setEditForm({ ...editForm, isOnSale: e.target.checked })}
                                                className="w-4 h-4 accent-[var(--theme-accent)] cursor-pointer rounded"
                                                aria-label="Toggle Sale Status"
                                            />
                                            {editForm.isOnSale && (
                                                <input
                                                    type="number"
                                                    className="w-16 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-center text-[var(--theme-text-primary)] outline-none font-mono tabular-nums py-0.5"
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
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium tabular-nums bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    {currencySymbol} {p.salePrice}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--theme-text-tertiary)] text-xs">-</span>
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
                                                className="p-1.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/20 rounded-xl border border-[var(--theme-accent)]/20 transition-colors cursor-pointer"
                                                title="Save Changes"
                                                aria-label="Save Changes"
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)] rounded-xl transition-colors cursor-pointer"
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
                                                className="p-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] rounded-xl transition-colors cursor-pointer"
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
                                                className="p-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors cursor-pointer"
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
