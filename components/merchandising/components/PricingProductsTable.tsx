import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';
import { priceCatalogGroup, wholeRange } from '../../../utils/priceCatalogGroups';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { sellingMargin } from '../../../utils/priceManager';
import { PriceGroupLocations } from './PriceGroupLocations';

export function PricingProductsTable() {
    const { selectedIds, toggleSelectAll, toggleSelection, filteredProducts, sortConfig, handleSort, currencySymbol, catalogLoading } = useMerchandising();
    const [expanded, setExpanded] = useState<string | null>(null);
    const allSelected = filteredProducts.length > 0 && filteredProducts.every(product => selectedIds.has(product.id));
    const sortButton = (key: 'name' | 'price', label: string) => <button type="button" onClick={() => handleSort(key)} className="min-h-11 inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2">{label}{sortConfig.key === key && <span aria-label={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</button>;

    return (
        <div>
            {/* Mobile Card List (md:hidden) */}
            <div className="md:hidden divide-y divide-[var(--theme-border)]">
                <div className="p-3 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
                    <label className="flex items-center gap-2 cursor-pointer min-h-11">
                        <input
                            type="checkbox"
                            aria-label="Select all products on this page"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            disabled={catalogLoading}
                            className="accent-[var(--theme-accent)] w-4 h-4"
                        />
                        <span className="font-semibold text-[var(--theme-text-primary)]">Select All</span>
                    </label>
                    <div className="flex items-center gap-2">
                        {sortButton('name', 'Name')}
                        {sortButton('price', 'Price')}
                    </div>
                </div>

                {filteredProducts.map(product => {
                    const group = priceCatalogGroup(product);
                    const price = Math.round(effectivePrice(product) ?? 0);
                    const margin = sellingMargin(product);
                    const isExpanded = expanded === product.id;

                    return (
                        <div key={product.id} className="p-3.5 space-y-2.5 bg-[var(--theme-bg-card)]">
                            <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        aria-label={`Select ${product.name}`}
                                        checked={selectedIds.has(product.id)}
                                        onChange={() => toggleSelection(product.id)}
                                        disabled={catalogLoading}
                                        className="accent-[var(--theme-accent)] w-4 h-4 mt-1 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm text-[var(--theme-text-primary)] leading-tight">{product.name}</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{product.sku || 'No SKU'} · {product.category}</p>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--theme-bg-subtle)] p-2.5 rounded-xl border border-[var(--theme-border)]">
                                <div>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] block">Selling Price</span>
                                    <span className="font-semibold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                        {currencySymbol} {wholeRange(group?.minPrice ?? price, group?.maxPrice ?? price)}
                                    </span>
                                    {(group?.priceVariants || 1) > 1 && <span className="block text-[10px] text-[var(--theme-text-secondary)]">Varies by location</span>}
                                </div>
                                <div>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] block">Target Margin</span>
                                    <span className="font-semibold font-mono tabular-nums text-[var(--theme-text-primary)]">
                                        {wholeRange(group ? group.minMargin : margin, group ? group.maxMargin : margin, '%')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] block">Store Locations</span>
                                    <span className="font-medium text-[var(--theme-text-primary)]">{group?.locationCount || 1} locations ({group?.recordCount || 1} records)</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] block">Sale Status</span>
                                    <span className="font-medium text-[var(--theme-text-primary)]">{group ? group.saleLocations ? `${group.saleLocations} locations on sale` : 'No active sales' : product.isOnSale ? 'On sale' : 'Regular price'}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label={`${isExpanded ? 'Hide' : 'Review'} locations for ${product.name}`}
                                aria-expanded={isExpanded}
                                onClick={() => setExpanded(isExpanded ? null : product.id)}
                                className="w-full min-h-11 flex items-center justify-center gap-1.5 rounded-xl px-3 border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs font-semibold text-[var(--theme-text-primary)] active:scale-[0.99] transition-all"
                            >
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                <span>{isExpanded ? 'Hide Locations' : 'Review Locations'}</span>
                            </button>

                            {isExpanded && (
                                <div className="mt-2 pt-2 border-t border-[var(--theme-border)]">
                                    <PriceGroupLocations product={product} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[620px]">
                    <caption className="sr-only">One row per product SKU. Price ranges and location counts cover records matching the current filters.</caption>
                    <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                        <tr>
                            <th className="p-3 w-12"><input type="checkbox" aria-label="Select all products on this page" checked={allSelected} onChange={toggleSelectAll} disabled={catalogLoading} className="accent-[var(--theme-accent)] w-4 h-4" /></th>
                            <th className="px-3" aria-sort={sortConfig.key === 'name' ? sortConfig.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('name', 'Product')}</th>
                            <th className="px-3">Locations</th>
                            <th className="px-3 text-right">{sortButton('price', 'Selling price')}</th>
                            <th className="px-3 text-right">Margin range</th>
                            <th className="px-3">Sale status</th>
                            <th className="p-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">{filteredProducts.map(product => {
                        const group = priceCatalogGroup(product);
                        const price = Math.round(effectivePrice(product) ?? 0);
                        const margin = sellingMargin(product);
                        const isExpanded = expanded === product.id;
                        return <Fragment key={product.id}><tr className="text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]">
                            <td className="p-3"><input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedIds.has(product.id)} onChange={() => toggleSelection(product.id)} disabled={catalogLoading} className="accent-[var(--theme-accent)] w-4 h-4" /></td>
                            <td className="p-3"><button type="button" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : product.id)} className="text-left min-h-11 font-semibold focus-visible:outline focus-visible:outline-2">{product.name}<span className="block text-xs font-normal text-[var(--theme-text-secondary)]">{product.sku || 'No SKU'} · {product.category}</span></button></td>
                            <td className="p-3 tabular-nums">{group?.locationCount || 1}<span className="block text-xs text-[var(--theme-text-secondary)]">{group?.recordCount || 1} records</span></td>
                            <td className="p-3 text-right tabular-nums">{currencySymbol} {wholeRange(group?.minPrice ?? price, group?.maxPrice ?? price)}{(group?.priceVariants || 1) > 1 && <span className="block text-xs text-[var(--theme-text-secondary)]">Prices vary by location</span>}</td>
                            <td className="p-3 text-right tabular-nums">{wholeRange(group ? group.minMargin : margin, group ? group.maxMargin : margin, '%')}</td>
                            <td className="p-3 text-xs">{group ? group.saleLocations ? `${group.saleLocations} locations on sale` : 'No active sales' : product.isOnSale ? 'On sale' : 'Regular price'}</td>
                            <td className="p-3"><button type="button" aria-label={`${isExpanded ? 'Hide' : 'Review'} locations for ${product.name}`} aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : product.id)} className="min-h-11 min-w-11 flex items-center gap-1 rounded-lg px-2 border border-[var(--theme-border)] focus-visible:outline focus-visible:outline-2">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<span>Locations</span></button></td>
                        </tr>{isExpanded && <tr><td colSpan={7}><PriceGroupLocations product={product} /></td></tr>}</Fragment>;
                    })}</tbody>
                </table>
            </div>
        </div>
    );
}
