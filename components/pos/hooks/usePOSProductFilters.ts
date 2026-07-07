import React, { useState, useMemo, useEffect } from 'react';
import { Product, TransferRecord, Site } from '../../../types';
import { productsService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';

interface UsePOSProductFiltersProps {
    products: Product[];
    activeSite: Site | undefined;
    transfers: TransferRecord[];
}

const getParentCategory = (category: string): string => {
    const cat = (category || '').trim().toLowerCase();
    
    // Fresh Food & Deli
    if ([
        'fruit & vegetables', 'fresh produce', 'dairy, eggs & fridge', 'dairy & eggs',
        'meat & poultry', 'seafood', 'bakery & bread', 'deli & prepared meals'
    ].includes(cat)) {
        return 'Fresh Food & Deli';
    }

    // Pantry & Groceries
    if ([
        'snacks & confectionery', 'baking & dessert needs', 'grains, pasta & rice', 
        'sauces, oils & condiments', 'spices & seasonings', 'canned food & soups', 
        'breakfast & cereals', 'tea, coffee & cocoa', 'drinks & beverages', 'beverages',
        'pantry & dry goods'
    ].includes(cat)) {
        return 'Pantry & Groceries';
    }

    // Frozen Food
    if ([
        'frozen meals & sides', 'frozen vegetables & fruit', 'ice cream & desserts', 'frozen food'
    ].includes(cat)) {
        return 'Frozen Food';
    }

    // Household & Personal
    if ([
        'baby & toddler', 'nappies, wipes & toiletries', 'health & beauty', 
        'dental & oral care', 'hair & body care', 'cosmetics & skin care', 
        'vitamins & supplements', 'pharmacy & first aid', 'household & cleaning',
        'laundry & dishwashing', 'cleaning products & tools', 'tissues, paper & foils',
        'pest control & garden care', 'pet supplies', 'dog food & accessories',
        'cat food & accessories', 'small pet supplies'
    ].includes(cat)) {
        return 'Household & Personal';
    }

    // General Merchandise
    if ([
        'general merchandise & apparel', 'general', 'stationery, office & books',
        'electronics & batteries', 'homewares, kitchen & dining', 'clothing & accessories',
        'toys & recreation', 'industrial', 'automotive'
    ].includes(cat)) {
        return 'General Merchandise';
    }

    return 'Other';
};

export const usePOSProductFilters = ({
    products,
    activeSite,
    transfers
}: UsePOSProductFiltersProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [sortBy, setSortBy] = useState('default');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedVelocities, setSelectedVelocities] = useState<string[]>([]);
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [onSaleOnly, setOnSaleOnly] = useState(false);
    const [competitorMatchedOnly, setCompetitorMatchedOnly] = useState(false);
    
    const [serverSearchResults, setServerSearchResults] = useState<Product[]>([]);
    const [isSearchingServer, setIsSearchingServer] = useState(false);

    const resetAllFilters = React.useCallback(() => {
        setSelectedCategory('All');
        setSelectedDepartment('All');
        setSortBy('default');
        setMinPriceFilter('');
        setMaxPriceFilter('');
        setSelectedBrands([]);
        setSelectedVelocities([]);
        setStockStatusFilter('all');
        setOnSaleOnly(false);
        setCompetitorMatchedOnly(false);
    }, []);

    useEffect(() => {
        setSelectedCategory('All');
    }, [selectedDepartment]);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) {
            setServerSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingServer(true);
            try {
                const results = await productsService.search(searchTerm, activeSite?.id);
                setServerSearchResults(results);
            } catch (err) {
                logger.error('usePOSProductFilters', "Product search failed", err);
            } finally {
                setIsSearchingServer(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, activeSite]);

    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
        if (selectedDepartment === 'All') return ['All', ...uniqueCats];
        return ['All', ...uniqueCats.filter(cat => getParentCategory(cat) === selectedDepartment)];
    }, [products, selectedDepartment]);

    const filteredProducts = useMemo(() => {
        let baseList = products;
        if (serverSearchResults.length > 0) {
            const combined = [...products];
            serverSearchResults.forEach(sp => {
                if (!combined.find(p => p.id === sp.id)) combined.push(sp);
            });
            baseList = combined;
        }
        
        let filtered = baseList.filter(p => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                (p.name || '').toLowerCase().includes(searchLower) || 
                (p.sku || '').toLowerCase().includes(searchLower) || 
                (p.barcode || '').toLowerCase().includes(searchLower) || 
                (p.barcodes || []).some(b => (b || '').toLowerCase().includes(searchLower));
            
            const matchesDepartment = selectedDepartment === 'All' || getParentCategory(p.category) === selectedDepartment;
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            
            const matchesMinPrice = minPriceFilter === '' || isNaN(parseFloat(minPriceFilter)) || (p.price || 0) >= parseFloat(minPriceFilter);
            const matchesMaxPrice = maxPriceFilter === '' || isNaN(parseFloat(maxPriceFilter)) || (p.price || 0) <= parseFloat(maxPriceFilter);
            
            const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand || 'No Brand');
            const matchesVelocity = selectedVelocities.length === 0 || selectedVelocities.includes(p.salesVelocity || 'Low');
            
            let matchesStockStatus = p.stock > 0;
            const threshold = p.minStock !== undefined && p.minStock !== null && p.minStock > 0 ? p.minStock : 10;
            if (stockStatusFilter === 'in_stock') {
                matchesStockStatus = p.stock > 0;
            } else if (stockStatusFilter === 'low_stock') {
                matchesStockStatus = p.stock > 0 && p.stock < threshold;
            } else if (stockStatusFilter === 'out_of_stock') {
                matchesStockStatus = p.stock <= 0;
            } else if (stockStatusFilter === 'all') {
                matchesStockStatus = true;
            }
            
            const matchesOnSale = !onSaleOnly || p.isOnSale === true;
            const matchesCompetitor = !competitorMatchedOnly || (p.competitorPrice !== undefined && p.competitorPrice !== null);
            
            let hasBeenReceived = false;
            if (activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center') {
                hasBeenReceived = !!p.location && p.location.trim() !== '' && p.location !== 'Receiving Dock' && /^[A-Z]-\d{2}-\d{2}$/.test(p.location.trim());
            } else if (activeSite?.type === 'Store' || activeSite?.type === 'Dark Store') {
                hasBeenReceived = (p.siteId === activeSite?.id || p.site_id === activeSite?.id);
            } else {
                hasBeenReceived = !!p.location && p.location.trim() !== '';
            }
            return matchesSearch && matchesDepartment && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesBrand && matchesVelocity && matchesStockStatus && matchesOnSale && matchesCompetitor && hasBeenReceived;
        });

        // Apply Sorting
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'name-asc') {
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'name-desc') {
            filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        } else if (sortBy === 'stock-desc') {
            filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        } else if (sortBy === 'velocity-desc') {
            const velMap: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
            filtered.sort((a, b) => (velMap[b.salesVelocity || 'Low'] || 0) - (velMap[a.salesVelocity || 'Low'] || 0));
        } else if (sortBy === 'expiry-asc') {
            filtered.sort((a, b) => {
                if (!a.expiryDate) return 1;
                if (!b.expiryDate) return -1;
                return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            });
        }

        return filtered;
    }, [searchTerm, selectedDepartment, selectedCategory, products, activeSite, transfers, serverSearchResults, sortBy, minPriceFilter, maxPriceFilter, selectedBrands, selectedVelocities, stockStatusFilter, onSaleOnly, competitorMatchedOnly]);

    return {
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        selectedDepartment, setSelectedDepartment,
        sortBy, setSortBy,
        minPriceFilter, setMinPriceFilter,
        maxPriceFilter, setMaxPriceFilter,
        selectedBrands, setSelectedBrands,
        selectedVelocities, setSelectedVelocities,
        stockStatusFilter, setStockStatusFilter,
        onSaleOnly, setOnSaleOnly,
        competitorMatchedOnly, setCompetitorMatchedOnly,
        serverSearchResults, isSearchingServer,
        resetAllFilters,
        categories,
        filteredProducts
    };
};
