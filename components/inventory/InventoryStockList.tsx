import React, { useState, useCallback, useMemo } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Site } from '../../types';
import { formatCompactNumber } from '../../utils/formatting';
import { ProductDetailsModal } from './ProductDetailsModal';

// --- Subcomponents & Helpers ---
import { LocationDetail, getInventoryValue } from './utils/inventoryHelpers';
import { InventoryToolbar } from './components/InventoryToolbar';
import { InventoryDesktopTable } from './components/InventoryDesktopTable';
import { InventoryMobileList } from './components/InventoryMobileList';

interface InventoryStockListProps {
    products: Product[];
    totalCount: number;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    isLoading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    handleSort: (key: string, direction?: 'asc' | 'desc') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleBulkAction: (action: string) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    allProducts: Product[];
    user: any;
    itemsPerPage: number;
    currencySymbol?: string;
}

export const InventoryStockList: React.FC<InventoryStockListProps> = ({
    products,
    totalCount,
    currentPage,
    setCurrentPage,
    isLoading,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm,
    selectedIds,
    setSelectedIds,
    handleBulkAction,
    handleOpenEditProduct,
    handleDeleteProduct,
    handleOpenAdjust,
    sites,
    activeSite,
    isReadOnly,
    allProducts,
    user,
    itemsPerPage,
    currencySymbol
}) => {
    const [selectedViewProduct, setSelectedViewProduct] = useState<Product | null>(null);

    // Derived global total inventory value for ABC calculations
    const totalInventoryValue = useMemo(() => {
        return allProducts.reduce((sum, p) => sum + getInventoryValue(p), 0) || 1;
    }, [allProducts]);

    const getOtherLocationsForSku = useCallback((sku: string, currentProductId: string, currentProductSiteId?: string) => {
        if (!sku) return { count: 0, locations: [], details: [] };

        const cleanSku = sku.replace(/[-\s]/g, '').toUpperCase();
        const sameSkuProducts = allProducts.filter(p =>
            (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
            p.id !== currentProductId &&
            p.location &&
            p.location.trim() !== '' &&
            p.location !== 'On Order' &&
            (p.stock !== undefined && p.stock > 0) &&
            (currentProductSiteId ? (p.siteId === currentProductSiteId || (p as any).site_id === currentProductSiteId) : true)
        );

        const locationMap: Record<string, LocationDetail> = {};
        sameSkuProducts.forEach(p => {
            if (p.location && !locationMap[p.location]) {
                locationMap[p.location] = {
                    location: p.location,
                    stock: p.stock,
                    siteId: p.siteId || (p as any).site_id || null,
                    productId: p.id
                };
            }
        });

        const details = Object.values(locationMap);
        const uniqueLocations = details.map(d => d.location);

        return {
            count: uniqueLocations.length,
            locations: uniqueLocations.slice(0, 3),
            details
        };
    }, [allProducts]);

    // Hide 0-stock 'On Order' ghost placeholders if a real record with stock or physical location exists for that SKU
    const visibleProducts = useMemo(() => {
        return products.filter(product => {
            const isGhostOnOrder = (product.location === 'On Order' || !product.location) && (!product.stock || product.stock === 0);
            if (!isGhostOnOrder) return true;

            const cleanSku = product.sku ? product.sku.replace(/[-\s]/g, '').toUpperCase() : '';
            const siteId = product.siteId || (product as any).site_id;

            const hasRealProduct = allProducts.some(p =>
                p.id !== product.id &&
                (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
                (p.siteId === siteId || (p as any).site_id === siteId) &&
                ((p.stock !== undefined && p.stock > 0) || (p.location && p.location !== 'On Order'))
            ) || products.some(p =>
                p.id !== product.id &&
                (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
                (p.siteId === siteId || (p as any).site_id === siteId) &&
                ((p.stock !== undefined && p.stock > 0) || (p.location && p.location !== 'On Order'))
            );

            return !hasRealProduct;
        });
    }, [products, allProducts]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, [setSelectedIds]);

    return (
        <div className="flex flex-col">
            <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col rounded-2xl isolate overflow-hidden shadow-xs">
                {/* Search, Filter Toolbar & Bulk Indicators */}
                <InventoryToolbar
                    products={visibleProducts}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filters={filters}
                    setFilters={setFilters}
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                    activeSite={activeSite}
                    isReadOnly={isReadOnly}
                    sites={sites}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    handleBulkAction={handleBulkAction}
                />

                {/* Grid & List View */}
                <div className="flex-1 overflow-x-auto">
                    <InventoryDesktopTable
                        products={visibleProducts}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        sortConfig={sortConfig}
                        handleSort={handleSort}
                        sites={sites}
                        activeSite={activeSite}
                        isReadOnly={isReadOnly}
                        totalInventoryValue={totalInventoryValue}
                        getOtherLocationsForSku={getOtherLocationsForSku}
                        toggleSelection={toggleSelection}
                        handleOpenAdjust={handleOpenAdjust}
                        handleOpenEditProduct={handleOpenEditProduct}
                        handleDeleteProduct={handleDeleteProduct}
                        setSelectedViewProduct={setSelectedViewProduct}
                        currencySymbol={currencySymbol}
                    />

                    <InventoryMobileList
                        products={visibleProducts}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        sites={sites}
                        activeSite={activeSite}
                        isReadOnly={isReadOnly}
                        totalInventoryValue={totalInventoryValue}
                        toggleSelection={toggleSelection}
                        handleOpenAdjust={handleOpenAdjust}
                        handleOpenEditProduct={handleOpenEditProduct}
                        handleDeleteProduct={handleDeleteProduct}
                        setSelectedViewProduct={setSelectedViewProduct}
                        currencySymbol={currencySymbol}
                    />

                    {visibleProducts.length === 0 && (
                        <div className="text-center py-12 text-[var(--theme-text-muted)]">
                            <Box size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-semibold text-sm text-[var(--theme-text-secondary)]">No products found</p>
                            <p className="text-xs mt-1">Try adjusting your filters or search term</p>
                        </div>
                    )}
                </div>

                {/* Product Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] rounded-b-2xl">
                    <div className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Displays: <span className="text-[var(--theme-text-primary)] font-bold font-mono tabular-nums">{products.length}</span> <span className="text-[var(--theme-text-muted)]">/</span> <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums">{formatCompactNumber(totalCount)}</span> Records
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="h-9 px-3.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] flex items-center gap-1.5 group cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            Prev
                        </button>

                        <div className="flex items-center gap-2 bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)] shadow-xs">
                            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Page</span>
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{currentPage}</span>
                            <span className="text-[var(--theme-text-muted)] mx-0.5 text-[11px]">/</span>
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] font-mono tabular-nums">{Math.max(1, Math.ceil(totalCount / itemsPerPage))}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(totalCount / itemsPerPage))))}
                            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading}
                            className="h-9 px-3.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-30 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] flex items-center gap-1.5 group cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                            Next
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Details Modal Overlay */}
            <ProductDetailsModal
                product={selectedViewProduct}
                isOpen={!!selectedViewProduct}
                onClose={() => setSelectedViewProduct(null)}
                currencySymbol={currencySymbol}
                onEdit={handleOpenEditProduct}
            />
        </div>
    );
};
export default InventoryStockList;
