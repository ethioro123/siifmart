import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';

// --- Subcomponents ---
import { POSHeader } from './components/POSHeader';
import { POSDepartments } from './components/POSDepartments';
import { POSCatalog } from './components/POSCatalog';
import { POSFilterSidebar } from './components/POSFilterSidebar';
import { POSOfflineBanner } from './components/POSOfflineBanner';

const ITEMS_PER_PAGE = 24;

export const POSProductGrid: React.FC = () => {
    const {
        searchTerm,
        selectedCategory,
        filteredProducts,
        selectedDepartment,
        sortBy,
        minPriceFilter,
        maxPriceFilter,
        selectedBrands,
        selectedVelocities,
        stockStatusFilter,
        onSaleOnly,
        competitorMatchedOnly
    } = usePOS();

    const { products } = useData();

    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    const availableBrands = useMemo(() => {
        const brandsSet = new Set((products as Product[]).map((p: Product) => p.brand).filter((b: any): b is string => !!b));
        return Array.from(brandsSet).sort() as string[];
    }, [products]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedDepartment && selectedDepartment !== 'All') count++;
        if (selectedCategory && selectedCategory !== 'All') count++;
        if (minPriceFilter || maxPriceFilter) count++;
        if (selectedBrands.length > 0) count++;
        if (selectedVelocities.length > 0) count++;
        if (stockStatusFilter !== 'all') count++;
        if (onSaleOnly) count++;
        if (competitorMatchedOnly) count++;
        if (sortBy !== 'default') count++;
        return count;
    }, [selectedDepartment, selectedCategory, minPriceFilter, maxPriceFilter, selectedBrands, selectedVelocities, stockStatusFilter, onSaleOnly, competitorMatchedOnly, sortBy]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedDepartment, minPriceFilter, maxPriceFilter, selectedBrands, selectedVelocities, stockStatusFilter, onSaleOnly, competitorMatchedOnly, sortBy]);

    return (
        <div className="flex-1 flex flex-col bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-[22px] overflow-hidden pb-24 lg:pb-0 transition-colors duration-200 relative">
            <POSOfflineBanner />
            <div className="px-4 pt-4 pb-3 border-b border-[var(--theme-border-subtle)] space-y-3 sm:px-5 sm:pt-5">
                {/* Header elements search barcode warnings and trophy sync badges */}
                <POSHeader
                    setIsFilterPanelOpen={setIsFilterPanelOpen}
                    activeFiltersCount={activeFiltersCount}
                />

                {/* Active filter chips (renders only when filters are active) */}
                <POSDepartments />
            </div>

            {/* Products grid lists catalog */}
            <POSCatalog
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                totalPages={totalPages}
                paginatedProducts={paginatedProducts}
            />

            {/* Slide-Out Advanced Filter Sidebar Overlay drawer */}
            <POSFilterSidebar
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                availableBrands={availableBrands}
                activeFiltersCount={activeFiltersCount}
            />
        </div>
    );
};
export default POSProductGrid;
