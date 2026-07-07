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
    handleSort: (key: string) => void;
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
    itemsPerPage
}) => {
    const [selectedViewProduct, setSelectedViewProduct] = useState<Product | null>(null);

    // Derived global total inventory value for ABC calculations
    const totalInventoryValue = useMemo(() => {
        return allProducts.reduce((sum, p) => sum + getInventoryValue(p), 0) || 1;
    }, [allProducts]);

    const getOtherLocationsForSku = useCallback((sku: string, currentProductId: string, currentProductSiteId?: string) => {
        if (!sku) return { count: 0, locations: [], details: [] };

        const sameSkuProducts = allProducts.filter(p =>
            p.sku === sku &&
            p.id !== currentProductId &&
            p.location &&
            p.location.trim() !== '' &&
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
            <div className="flex-1 glass-panel flex flex-col rounded-2xl">
                {/* Search, Filter Toolbar & Bulk Indicators */}
                <InventoryToolbar
                    products={products}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filters={filters}
                    setFilters={setFilters}
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
                        products={products}
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
                    />

                    <InventoryMobileList
                        products={products}
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
                    />

                    {products.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Box size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold">No products found</p>
                            <p className="text-xs mt-2">Try adjusting your filters or search term</p>
                        </div>
                    )}
                </div>

                {/* Product Pagination Controls */}
                <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/40 backdrop-blur-md rounded-b-3xl">
                    <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
                        Displays: <span className="text-white">{products.length}</span> <span className="text-gray-700">/</span> <span className="text-gray-400">{formatCompactNumber(totalCount)}</span> Records
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="px-4 py-2 bg-white/5 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 flex items-center gap-2 group cursor-pointer"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            Prev
                        </button>

                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/5">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Page</span>
                            <span className="text-[12px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">{currentPage}</span>
                            <span className="text-gray-700 mx-1 text-[10px]">/</span>
                            <span className="text-[12px] font-black text-gray-500 font-mono">{Math.max(1, Math.ceil(totalCount / itemsPerPage))}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(totalCount / itemsPerPage))))}
                            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading}
                            className="px-4 py-2 bg-white/5 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 flex items-center gap-2 group cursor-pointer"
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
            />
        </div>
    );
};
export default InventoryStockList;
