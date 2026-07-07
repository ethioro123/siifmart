import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';

// --- Subcomponents ---
import { POSHeader } from './components/POSHeader';
import { POSDepartments } from './components/POSDepartments';
import { POSCatalog } from './components/POSCatalog';
import { POSFilterSidebar } from './components/POSFilterSidebar';

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
        if (selectedDepartment !== 'All') count++;
        if (selectedCategory !== 'All') count++;
        if (minPriceFilter !== '') count++;
        if (maxPriceFilter !== '') count++;
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
        <div className="flex-1 flex flex-col bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] overflow-hidden pb-20 lg:pb-0 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] lg:backdrop-blur-2xl transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C5E3B]/5 to-transparent pointer-events-none" />
            <div className="p-4 border-b border-white/5 space-y-4">
                {/* Header elements search barcode warnings and trophy sync badges */}
                <POSHeader
                    setIsFilterPanelOpen={setIsFilterPanelOpen}
                    activeFiltersCount={activeFiltersCount}
                />

                {/* Departments categories horizontal selectors lists */}
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
