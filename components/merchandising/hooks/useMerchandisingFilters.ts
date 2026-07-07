import { useState, useMemo, useEffect } from 'react';
import type { Product } from '../../../types';
import type { MerchandisingFilters } from '../MerchandisingContext';

interface UseMerchandisingFiltersProps {
    products: Product[];
    getMargin: (price: number, cost: number) => number;
}

export const useMerchandisingFilters = ({
    products,
    getMargin
}: UseMerchandisingFiltersProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Advanced Filtering & Sorting State
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'margin'; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });
    const [filters, setFilters] = useState<MerchandisingFilters>({
        categories: [],
        sites: [],
        velocities: [],
        onSale: null,
        minPrice: '',
        maxPrice: '',
        minMargin: '',
        maxMargin: ''
    });

    // Sorting Helper
    const handleSort = (key: keyof Product | 'margin') => {
        if (sortConfig.key === key) {
            setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            setSortConfig({ key, direction: 'asc' });
        }
    };

    // Filtering
    const filteredProducts = useMemo(() => {
        let result = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Category Filter
        if (filters.categories.length > 0) {
            result = result.filter(p => filters.categories.includes(p.category));
        }

        // Site Filter
        if (filters.sites.length > 0) {
            result = result.filter(p => filters.sites.includes(p.siteId || (p as any).site_id));
        }

        // Velocity Filter
        if (filters.velocities.length > 0) {
            result = result.filter(p => filters.velocities.includes(p.salesVelocity || ''));
        }

        // Sale Filter
        if (filters.onSale !== null) {
            result = result.filter(p => p.isOnSale === filters.onSale);
        }

        // Price Range Filter
        if (filters.minPrice !== '') {
            result = result.filter(p => p.price >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice !== '') {
            result = result.filter(p => p.price <= parseFloat(filters.maxPrice));
        }

        // Margin Range Filter
        if (filters.minMargin !== '' || filters.maxMargin !== '') {
            result = result.filter(p => {
                const cost = p.costPrice || p.price * 0.7;
                const margin = getMargin(p.price, cost);
                const min = filters.minMargin !== '' ? parseFloat(filters.minMargin) : -Infinity;
                const max = filters.maxMargin !== '' ? parseFloat(filters.maxMargin) : Infinity;
                return margin >= min && margin <= max;
            });
        }

        // Sorting
        result.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (sortConfig.key === 'margin') {
                valA = getMargin(a.price, a.costPrice || a.price * 0.7);
                valB = getMargin(b.price, b.costPrice || b.price * 0.7);
            } else {
                valA = a[sortConfig.key as keyof Product];
                valB = b[sortConfig.key as keyof Product];
            }

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const modifier = sortConfig.direction === 'asc' ? 1 : -1;
            if (typeof valA === 'string') {
                return valA.localeCompare(valB as string) * modifier;
            }
            return (valA - (valB as any)) * modifier;
        });

        return result;
    }, [products, searchTerm, filters, sortConfig, getMargin]);

    // Reset page when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    return {
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        isFilterPanelOpen,
        setIsFilterPanelOpen,
        sortConfig,
        setSortConfig,
        filters,
        setFilters,
        handleSort,
        filteredProducts
    };
};
