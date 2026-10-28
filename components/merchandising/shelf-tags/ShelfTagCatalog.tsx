import React, { useState, useMemo } from 'react';
import {
   Search,
   Filter,
   Printer,
   Eye,
   CheckCircle2,
   ChevronLeft,
   ChevronRight,
   Layers
} from 'lucide-react';
import type { Product } from '../../../types';
import { isProductHalal } from '../../../utils/labels/ShelfTagGenerator';

interface ShelfTagCatalogProps {
   products: Product[];
   currencySymbol: string;
   selectedIds: Set<string>;
   onToggleSelect: (id: string) => void;
   onToggleSelectAll: (allFilteredIds: string[]) => void;
   onOpenPreview: () => void;
   onPrintSelected: () => void;
   isPrinting: boolean;
}

export const ShelfTagCatalog: React.FC<ShelfTagCatalogProps> = ({
   products,
   currencySymbol,
   selectedIds,
   onToggleSelect,
   onToggleSelectAll,
   onOpenPreview,
   onPrintSelected,
   isPrinting
}) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
   const [selectedShelfPosition, setSelectedShelfPosition] = useState<string>('all');
   const [filterOnlySales, setFilterOnlySales] = useState(false);
   const [page, setPage] = useState(1);
   const pageSize = 25;

   // Extract available categories
   const categories = useMemo(() => {
      const set = new Set<string>();
      products.forEach((p) => {
         if (p.category) set.add(p.category);
      });
      return Array.from(set).sort();
   }, [products]);

   // Filtered products list
   const filteredProducts = useMemo(() => {
      return products.filter((p) => {
         if (p.status === 'archived') return false;
         if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesName = (p.name || '').toLowerCase().includes(term);
            const matchesSku = (p.sku || '').toLowerCase().includes(term);
            if (!matchesName && !matchesSku) return false;
         }
         if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
         if (selectedShelfPosition !== 'all' && (p.shelfPosition || 'Unassigned') !== selectedShelfPosition) return false;
         if (filterOnlySales && !p.isOnSale) return false;
         return true;
      });
   }, [products, searchTerm, selectedCategory, selectedShelfPosition, filterOnlySales]);

   const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
   const paginatedProducts = useMemo(() => {
      const start = (page - 1) * pageSize;
      return filteredProducts.slice(start, start + pageSize);
   }, [filteredProducts, page, pageSize]);

   // Prune selection check
   const allFilteredIds = useMemo(() => filteredProducts.map(p => p.id), [filteredProducts]);
   const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));

   return (
      <div className="space-y-4">
         {/* Filter Toolbar */}
         <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap gap-3 items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
               <Search size={15} className="text-[var(--theme-text-secondary)]" />
               <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                     setSearchTerm(e.target.value);
                     setPage(1);
                  }}
                  className="w-full bg-transparent border-none text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none"
               />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
               <select
                  value={selectedCategory}
                  onChange={(e) => {
                     setSelectedCategory(e.target.value);
                     setPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] outline-none"
               >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                     <option key={c} value={c}>{c}</option>
                  ))}
               </select>

               <select
                  value={selectedShelfPosition}
                  onChange={(e) => {
                     setSelectedShelfPosition(e.target.value);
                     setPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] outline-none"
               >
                  <option value="all">All Shelf Tiers</option>
                  <option value="Eye Level">Eye Level (Prime)</option>
                  <option value="Top Shelf">Top Shelf</option>
                  <option value="Bottom Shelf">Bottom Shelf</option>
                  <option value="Unassigned">Unassigned</option>
               </select>

               <button
                  type="button"
                  onClick={() => {
                     setFilterOnlySales(!filterOnlySales);
                     setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                     filterOnlySales
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                  }`}
               >
                  Promos Only
               </button>

               <button
                  type="button"
                  onClick={() => onToggleSelectAll(allFilteredIds)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] cursor-pointer"
               >
                  {isAllSelected ? 'Deselect All' : `Select All (${filteredProducts.length})`}
               </button>

               <button
                  type="button"
                  onClick={onOpenPreview}
                  disabled={selectedIds.size === 0}
                  className="px-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] disabled:opacity-40 text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer flex items-center gap-1.5"
               >
                  <Eye size={14} /> Preview
               </button>

               <button
                  type="button"
                  onClick={onPrintSelected}
                  disabled={selectedIds.size === 0 || isPrinting}
                  className="px-4 py-1.5 bg-[var(--theme-accent)] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-xs"
               >
                  <Printer size={14} /> Print Tags ({selectedIds.size})
               </button>
            </div>
         </div>

         {/* Catalog Table */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                  <thead>
                     <tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)] text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">
                        <th className="p-3.5 w-10 text-center">
                           <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => onToggleSelectAll(allFilteredIds)}
                              className="rounded cursor-pointer"
                           />
                        </th>
                        <th className="p-3.5">Product Name</th>
                        <th className="p-3.5">SKU</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Shelf Tier</th>
                        <th className="p-3.5 text-right">POS Price</th>
                        <th className="p-3.5 text-center">Label Preview</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                     {paginatedProducts.map((p) => {
                        const isSelected = selectedIds.has(p.id);
                        const regularWhole = Math.round(Number(p.price) || 0);
                        const saleWhole = p.salePrice && p.salePrice > 0 ? Math.round(Number(p.salePrice)) : null;
                        const effectivePrice = p.isOnSale && saleWhole && saleWhole > 0 ? saleWhole : regularWhole;
                        const isHalal = isProductHalal(p);

                        return (
                           <tr
                              key={p.id}
                              className={`hover:bg-[var(--theme-bg-panel-hover)] transition-colors ${
                                 isSelected ? 'bg-[var(--theme-accent)]/5' : ''
                              }`}
                           >
                              <td className="p-3.5 text-center">
                                 <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggleSelect(p.id)}
                                    className="rounded cursor-pointer"
                                 />
                              </td>
                              <td className="p-3.5 font-bold text-[var(--theme-text-primary)]">
                                 <div className="flex items-center gap-2">
                                    <span>{p.name}</span>
                                    {p.isOnSale && (
                                       <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                          Sale
                                       </span>
                                    )}
                                 </div>
                              </td>
                              <td className="p-3.5 font-mono text-[var(--theme-text-secondary)]">{p.sku}</td>
                              <td className="p-3.5 text-[var(--theme-text-secondary)]">{p.category || 'General'}</td>
                              <td className="p-3.5">
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    p.shelfPosition === 'Eye Level'
                                       ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                       : p.shelfPosition === 'Top Shelf'
                                       ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                       : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                 }`}>
                                    {p.shelfPosition || 'Unassigned'}
                                 </span>
                              </td>
                              <td className="p-3.5 text-right font-mono font-bold text-[var(--theme-text-primary)]">
                                 {p.isOnSale && saleWhole ? (
                                    <div>
                                       <span className="line-through text-[var(--theme-text-secondary)] text-[10px] mr-1.5 font-normal">
                                          {currencySymbol} {regularWhole}
                                       </span>
                                       <span className="text-amber-500 font-bold">
                                          {currencySymbol} {saleWhole}
                                       </span>
                                    </div>
                                 ) : (
                                    <span>{currencySymbol} {regularWhole}</span>
                                 )}
                              </td>
                              <td className="p-3.5 text-center">
                                 <div className="inline-block p-1.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-left min-w-[120px]">
                                    <div className="text-[8px] font-mono text-[var(--theme-text-secondary)] truncate">{p.sku}</div>
                                    <div className="text-[10px] font-bold text-[var(--theme-text-primary)] truncate max-w-[110px]">{p.name}</div>
                                    <div className="flex items-center justify-between mt-0.5">
                                       <span className="text-[11px] font-mono font-bold text-[var(--theme-accent)]">
                                          {currencySymbol} {effectivePrice}
                                       </span>
                                       {isHalal && (
                                          <span className="text-[7px] uppercase font-bold text-emerald-500">Halal</span>
                                       )}
                                    </div>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     {paginatedProducts.length === 0 && (
                        <tr>
                           <td colSpan={7} className="p-8 text-center text-[var(--theme-text-secondary)]">
                              No products found matching filters.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
               <div className="flex items-center justify-between p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-panel)] text-xs text-[var(--theme-text-secondary)]">
                  <span>
                     Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length} items
                  </span>
                  <div className="flex items-center gap-1.5">
                     <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40"
                     >
                        <ChevronLeft size={14} />
                     </button>
                     <span className="px-2 font-mono font-semibold text-[11px]">{page} / {totalPages}</span>
                     <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="p-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40"
                     >
                        <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
