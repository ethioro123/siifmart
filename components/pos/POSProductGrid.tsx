import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Protected } from '../Protected';
import Button from '../shared/Button';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { getSellUnit } from '../../utils/units';
import {
    ArrowLeft, Search, ArrowRight, X, Link, ShoppingBag,
    RefreshCw, WifiOff, CloudOff, CheckCircle, Trophy, Box, Package, Plus, Filter, RotateCcw
} from 'lucide-react';


export const POSProductGrid: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const {
        searchTerm,
        setSearchTerm,
        searchInputRef,
        handleSearchKeyDown,
        handleScanProduct,
        unknownBarcode,
        setUnknownBarcode,
        setCapturedBarcodeForModal,
        setIsUnknownBarcodeModalOpen,
        setIsMiscItemModalOpen,
        currentStorePoints,
        storeBonus,
        userBonusShare,
        categories,
        selectedCategory,
        setSelectedCategory,
        filteredProducts,
        addToCart,
        selectedDepartment,
        setSelectedDepartment,
        sortBy,
        setSortBy,
        minPriceFilter,
        setMinPriceFilter,
        maxPriceFilter,
        setMaxPriceFilter,
        selectedBrands,
        setSelectedBrands,
        selectedVelocities,
        setSelectedVelocities,
        stockStatusFilter,
        setStockStatusFilter,
        onSaleOnly,
        setOnSaleOnly,
        competitorMatchedOnly,
        setCompetitorMatchedOnly,
        resetAllFilters,
    } = usePOS();

    const { triggerSync, posSyncStatus, posPendingSyncCount, settings, products } = useData();

    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const ITEMS_PER_PAGE = 24;

    const availableBrands = useMemo(() => {
        const brandsSet = new Set(products.map(p => p.brand).filter((b): b is string => !!b));
        return Array.from(brandsSet).sort();
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

    // Helper to check for Neutralino (native app mode)
    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;
    const native = isNativeApp ? (window as any).Neutralino.os : null;

    return (
        <div className="flex-1 flex flex-col bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] overflow-hidden pb-20 lg:pb-0 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] lg:backdrop-blur-2xl transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C5E3B]/5 to-transparent pointer-events-none" />
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/')}
                        icon={<ArrowLeft size={20} />}
                        title={t('pos.exitDashboard')}
                        aria-label="Exit to Dashboard"
                        className="p-3 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-[0_2px_12px_rgba(44,94,59,0.03)] dark:shadow-none"
                    />
                    <div className="flex-1 relative">
                        <div className="flex items-center bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl px-4 py-2.5 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] focus-within:ring-4 focus-within:ring-[#2C5E3B]/10 dark:focus-within:ring-[#A9CBA2]/10 transition-all duration-300 group">
                            <Search className="w-5 h-5 text-[#4D6E56] dark:text-[#7A9E83] group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('pos.searchProducts')}
                                className="bg-transparent border-none ml-3 flex-1 text-[#1E3F27] dark:text-[#EAE5D9] outline-none placeholder-stone-400 dark:placeholder-stone-500 font-medium min-w-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            {searchTerm.trim() && (
                                <button
                                    onClick={() => {
                                        const inputValue = searchInputRef.current?.value?.trim() || searchTerm.trim();
                                        if (inputValue) {
                                            handleScanProduct(inputValue);
                                        }
                                    }}
                                    className="ml-2 p-1.5 rounded-xl bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] transition-colors flex-shrink-0"
                                    aria-label="Search"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>

                        {/* Unknown Barcode Alert - Below Search Bar */}
                        {unknownBarcode && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-50">
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={() => setUnknownBarcode('')}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                                        aria-label="Dismiss"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-center">
                                            <p className="text-yellow-400 text-sm font-medium mb-1">{t('pos.unknownBarcodeDetected')}</p>
                                            <p className="text-yellow-300 text-2xl font-mono font-bold tracking-wider">{unknownBarcode}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setUnknownBarcode('')}
                                                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                                            >
                                                {t('pos.dismiss')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCapturedBarcodeForModal(unknownBarcode);
                                                    setIsUnknownBarcodeModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                            >
                                                <Link size={14} />
                                                {t('pos.linkBarcode')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Advanced Filter & Sort Button */}
                    <button
                        onClick={() => setIsFilterPanelOpen(true)}
                        className="relative bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl px-4 py-3 text-xs font-bold text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-[0_2px_12px_rgba(44,94,59,0.03)] dark:shadow-none"
                    >
                        <Filter className="w-4 h-4 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>Filter & Sort</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-sm">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                    <Protected permission="ADD_PRODUCT">
                        <Button
                            variant="secondary"
                            onClick={() => setIsMiscItemModalOpen(true)}
                            icon={<ShoppingBag size={16} />}
                            className="bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl px-4 text-sm font-bold text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 shadow-[0_2px_12px_rgba(44,94,59,0.03)] dark:shadow-none"
                        >
                            {t('pos.miscItem')}
                        </Button>
                    </Protected>
                    <div className="hidden md:block">
                        {/* Sync Status Badge */}
                        <button
                            onClick={() => triggerSync()}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 hover:scale-105 active:scale-95 ${posSyncStatus === 'offline' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                posSyncStatus === 'syncing' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    (posPendingSyncCount || 0) > 0 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                        'bg-[#2C5E3B]/10 border-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]' // Synced state
                                 }`}>
                            {posSyncStatus === 'syncing' ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : posSyncStatus === 'offline' ? (
                                <WifiOff size={14} />
                            ) : (posPendingSyncCount || 0) > 0 ? (
                                <CloudOff size={14} />
                            ) : (
                                <CheckCircle size={14} />
                            )}
                            <span>
                                {posSyncStatus === 'offline' ? t('pos.offline') :
                                    posSyncStatus === 'syncing' ? t('pos.syncing') :
                                        (posPendingSyncCount || 0) > 0 ? t('pos.syncPending') :
                                            t('pos.online')}
                                {((posPendingSyncCount || 0) > 0) && ` (${posPendingSyncCount} ${t('pos.queued')})`}
                            </span>
                        </button>
                    </div>

                    {/* Store Bonus Widget */}
                    {settings.posBonusEnabled !== false && currentStorePoints && storeBonus && (
                        <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-[#2C5E3B]/10 to-amber-600/10 border border-[#2C5E3B]/20 rounded-xl px-3 py-1.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                                storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                                    storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                                        storeBonus.tier.tierColor === 'cyan' ? 'from-[#2C5E3B] to-[#2C5E3B]/80' :
                                            storeBonus.tier.tierColor === 'purple' ? 'from-amber-600 to-amber-700' :
                                                'from-gray-400 to-gray-500'
                                } flex items-center justify-center`}>
                                <Trophy size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-1">
                                    {t('pos.teamBonus')}
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                                        storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                                            storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                                                storeBonus.tier.tierColor === 'cyan' ? 'from-[#2C5E3B] to-[#2C5E3B]/80' :
                                                    storeBonus.tier.tierColor === 'purple' ? 'from-amber-600 to-amber-700' :
                                                        'from-gray-400 to-gray-500'
                                        } text-white`}>
                                        {storeBonus.tier.tierName}
                                    </span>
                                </p>
                                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83]">{currentStorePoints.monthlyPoints.toLocaleString()} {t('pos.pts')}</p>
                            </div>
                            {userBonusShare && (
                                <div className="text-right pl-2 border-l border-[#2C5E3B]/20">
                                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                                        {formatCompactNumber(userBonusShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-[#4D6E56] dark:text-gray-500">{t('pos.yourShare')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Departments Row */}
                <div className="space-y-2 pt-1 border-t border-stone-200/40 dark:border-white/5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide px-1 -mx-2">
                        {['All', 'Fresh Food & Deli', 'Pantry & Groceries', 'Frozen Food', 'Household & Personal', 'General Merchandise', 'Other'].map(dept => (
                            <button
                                key={dept}
                                onClick={() => setSelectedDepartment(dept)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-300 ${selectedDepartment === dept
                                    ? 'bg-[#2C5E3B] text-white shadow-sm scale-[1.02]'
                                    : 'text-[#4D6E56] dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-white bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/15'
                                     }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subcategories Row */}
                {categories.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide px-1 -mx-2 border-t border-stone-150/40 dark:border-white/5 pt-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                    ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 shadow-sm'
                                    : 'text-[#4D6E56]/90 dark:text-stone-400 hover:text-[#2C5E3B] dark:hover:text-white bg-white/50 dark:bg-black/15 border border-[#E2DCCE]/60 dark:border-emerald-950/10'
                                     }`}
                                >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Active Filter Pills Row */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-150/40 dark:border-white/5">
                        <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83]">Filters:</span>
                        
                        {selectedDepartment !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                Dept: {selectedDepartment}
                                <button onClick={() => setSelectedDepartment('All')} title="Remove department filter" aria-label="Remove department filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}
                        
                        {selectedCategory !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                Cat: {selectedCategory}
                                <button onClick={() => setSelectedCategory('All')} title="Remove category filter" aria-label="Remove category filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {minPriceFilter !== '' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-600/10 text-amber-700 dark:text-amber-500 border border-amber-600/20">
                                Min: ${minPriceFilter}
                                <button onClick={() => setMinPriceFilter('')} title="Remove minimum price filter" aria-label="Remove minimum price filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {maxPriceFilter !== '' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-600/10 text-amber-700 dark:text-amber-500 border border-amber-600/20">
                                Max: ${maxPriceFilter}
                                <button onClick={() => setMaxPriceFilter('')} title="Remove maximum price filter" aria-label="Remove maximum price filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {selectedBrands.map(brand => (
                            <span key={brand} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                Brand: {brand}
                                <button onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brand))} title={`Remove brand filter: ${brand}`} aria-label={`Remove brand filter: ${brand}`} className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        ))}

                        {selectedVelocities.map(vel => (
                            <span key={vel} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20">
                                Velocity: {vel}
                                <button onClick={() => setSelectedVelocities(prev => prev.filter(v => v !== vel))} title={`Remove velocity filter: ${vel}`} aria-label={`Remove velocity filter: ${vel}`} className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        ))}

                        {stockStatusFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-600/10 text-blue-700 dark:text-blue-500 border border-blue-600/20">
                                Stock: {stockStatusFilter === 'in_stock' ? 'In Stock' : stockStatusFilter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                                <button onClick={() => setStockStatusFilter('all')} title="Remove stock filter" aria-label="Remove stock filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {onSaleOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600/10 text-red-700 dark:text-red-500 border border-red-600/20">
                                🏷️ On Sale
                                <button onClick={() => setOnSaleOnly(false)} title="Remove sale filter" aria-label="Remove sale filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {competitorMatchedOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-600/10 text-purple-700 dark:text-purple-500 border border-purple-600/20">
                                ⚖️ Comp Price
                                <button onClick={() => setCompetitorMatchedOnly(false)} title="Remove competitor matched filter" aria-label="Remove competitor matched filter" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        {sortBy !== 'default' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-600/10 text-indigo-700 dark:text-indigo-500 border border-indigo-600/20">
                                Sort: {sortBy === 'price-asc' ? 'Price Asc' : sortBy === 'price-desc' ? 'Price Desc' : sortBy === 'name-asc' ? 'A-Z' : sortBy === 'name-desc' ? 'Z-A' : sortBy === 'stock-desc' ? 'Stock Desc' : sortBy === 'velocity-desc' ? 'Velocity' : 'Expiry'}
                                <button onClick={() => setSortBy('default')} title="Reset sorting to default" aria-label="Reset sorting to default" className="hover:text-red-500 ml-0.5"><X size={10} /></button>
                            </span>
                        )}

                        <button
                            onClick={resetAllFilters}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors ml-auto"
                        >
                            <RotateCcw size={8} />
                            Reset All
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <Box size={64} className="text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">{t('pos.noProductsAvailable')}</h3>
                        <p className="text-[#4D6E56] dark:text-[#7A9E83] max-w-md">
                            {t('pos.productsWillAppear')}
                            <br />
                            <button
                                onClick={() => navigate('/pos-dashboard')}
                                className="text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline mt-2 font-medium"
                            >
                                {t('pos.goToPOSCommand')}
                            </button>
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {paginatedProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    addToCart(product);
                                    if (isNativeApp && native) {
                                        native.vibrate(50);
                                    }
                                }}
                                disabled={product.stock === 0}
                                className={`text-left bg-white/70 dark:bg-[#18201B]/30 border rounded-2xl p-4 hover:bg-white dark:hover:bg-[#18201B]/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full active:scale-[0.98] shadow-sm hover:shadow-md ${product.stock <= 0 ? 'border-red-600/80 dark:border-red-500/60 opacity-60 cursor-not-allowed' : 'border-[#E2DCCE] dark:border-emerald-950/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30'}`}
                            >
                                <div className="aspect-square rounded-xl bg-[#F4F0E6] dark:bg-black/35 mb-4 overflow-hidden relative border border-[#E2DCCE]/40 dark:border-white/5 flex items-center justify-center">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                            onError={(e) => {
                                                // React-safe fallback: hide the broken img and let the sibling fallback show
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        {/* React-safe fallback (hidden by default, shown on img error) */}
                                        <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 items-center justify-center hidden">
                                            <Package size={32} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                        </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-[#F4F0E6] dark:bg-black/35 flex items-center justify-center">
                                            <Package size={32} className="text-[#2C5E3B]/20 dark:text-[#A9CBA2]/25" />
                                        </div>
                                    )}

                                     {/* Stock indicator */}
                                     {(() => {
                                         const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                                         const isOutOfStock = product.stock <= 0;
                                         const isLowStock = product.stock < threshold;
                                         
                                         let colorClasses = 'bg-white/80 dark:bg-black/50 text-[#4D6E56] dark:text-gray-300 border-[#E2DCCE]/60 dark:border-white/10';
                                         if (isOutOfStock) {
                                             colorClasses = 'bg-red-600 dark:bg-red-700 text-white border-transparent shadow-none';
                                         } else if (isLowStock) {
                                             colorClasses = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
                                         }

                                         return (
                                             <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1 ${colorClasses}`}>
                                                 {isOutOfStock ? (
                                                     <span>{t('common.outOfStock')}</span>
                                                 ) : (
                                                     <>
                                                         {product.stock.toLocaleString(undefined, { maximumFractionDigits: getSellUnit(product.unit).category === 'count' ? 0 : 2 })}
                                                         <span className="text-[7px] opacity-70 uppercase">{getSellUnit(product.unit).shortLabel}</span>
                                                     </>
                                                 )}
                                             </div>
                                         );
                                      })()}

                                    {product.isOnSale && (
                                        <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-wider shadow-sm">
                                            {t('pos.sale')}
                                        </div>
                                    )}

                                    {product.stock <= 0 && (
                                        <div className="absolute inset-0 bg-transparent flex items-center justify-center z-10" />
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] text-xs md:text-sm line-clamp-2 min-h-[2.5rem] leading-tight mb-2 group-hover:text-[#2C5E3B] dark:group-hover:text-white transition-colors">{product.name}</h3>
                                    <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-[#E2DCCE]/30 dark:border-white/5">
                                        <div className="flex items-baseline gap-1.5">
                                            {product.isOnSale && product.salePrice ? (
                                                <>
                                                    <p className="text-amber-600 dark:text-amber-400 font-extrabold text-base tracking-tight">{CURRENCY_SYMBOL} {product.salePrice}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[8px] text-amber-600/60 dark:text-amber-400/60 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                    <p className="text-stone-400 dark:text-gray-600 text-[10px] line-through">{CURRENCY_SYMBOL} {product.price}</p>
                                                </>
                                            ) : (
                                                <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black text-base tracking-tight">{CURRENCY_SYMBOL} {product.price}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[8px] text-[#4D6E56]/60 dark:text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                            )}
                                        </div>
                                         <div className="w-8 h-8 rounded-xl bg-[#2C5E3B]/10 dark:bg-white/5 border border-[#2C5E3B]/20 dark:border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2C5E3B]/20 dark:group-hover:bg-white/10">
                                             <Plus size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                         </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-8 border-t border-[#E2DCCE]/40 dark:border-white/5 mt-6 px-1">
                                <span className="text-xs text-[#4D6E56] dark:text-stone-400 font-semibold">
                                    Showing <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                    <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                                    </span>{' '}
                                    of <span className="font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">{filteredProducts.length}</span> products
                                </span>
                                
                                <div className="flex items-center gap-1">
                                    {/* First Page */}
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(1)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs"
                                    >
                                        &laquo;
                                    </button>
                                    
                                    {/* Prev Page */}
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs"
                                    >
                                        &lsaquo;
                                    </button>

                                    {/* Page Numbers */}
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 5;
                                        let startPage = Math.max(1, currentPage - 2);
                                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                        
                                        if (endPage - startPage < maxVisiblePages - 1) {
                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                        }

                                        for (let p = startPage; p <= endPage; p++) {
                                            pages.push(
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${currentPage === p
                                                        ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                                        : 'bg-white dark:bg-black/25 border-[#E2DCCE] dark:border-emerald-950/20 text-[#4D6E56] dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-black/40'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        }
                                        return pages;
                                    })()}

                                    {/* Next Page */}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs"
                                    >
                                        &rsaquo;
                                    </button>
                                    
                                    {/* Last Page */}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-[#2C5E3B] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-all font-bold text-xs"
                                    >
                                        &raquo;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Slide-Out Advanced Filter Sidebar Overlay */}
            {isFilterPanelOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsFilterPanelOpen(false)}
                    />
                    
                    {/* Sidebar Container */}
                    <div className="relative w-full max-w-md bg-[#FAF6EE] dark:bg-[#121915] h-full shadow-2xl flex flex-col z-10 border-l border-[#E2DCCE]/50 dark:border-emerald-950/20 transform transition-transform duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-[#E2DCCE] dark:border-emerald-950/30 flex items-center justify-between bg-white/50 dark:bg-black/20">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <h2 className="text-base font-extrabold text-[#1E3F27] dark:text-[#EAE5D9]">Advanced Filters</h2>
                                {activeFiltersCount > 0 && (
                                    <span className="bg-[#2C5E3B] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsFilterPanelOpen(false)}
                                title="Close filter panel"
                                aria-label="Close filter panel"
                                className="w-8 h-8 rounded-full bg-stone-200/50 hover:bg-stone-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 flex items-center justify-center text-stone-600 dark:text-[#A9CBA2] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Body / Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                            {/* Sort Options */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Sort Products By</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'default', label: 'Default' },
                                        { id: 'name-asc', label: 'Name: A-Z' },
                                        { id: 'name-desc', label: 'Name: Z-A' },
                                        { id: 'price-asc', label: 'Price: Low-High' },
                                        { id: 'price-desc', label: 'Price: High-Low' },
                                        { id: 'stock-desc', label: 'Stock: High-Low' },
                                        { id: 'velocity-desc', label: 'Sales Velocity' },
                                        { id: 'expiry-asc', label: 'Expiry Soon' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition-all ${sortBy === opt.id
                                                ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                                : 'bg-white dark:bg-black/25 border-[#E2DCCE] dark:border-emerald-950/20 text-[#4D6E56] dark:text-stone-300 hover:bg-white/80 dark:hover:bg-black/40'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Price Range</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPriceFilter}
                                            onChange={(e) => setMinPriceFilter(e.target.value)}
                                            className="w-full bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl pl-6 pr-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                        />
                                    </div>
                                    <span className="text-xs text-stone-400 font-bold">to</span>
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPriceFilter}
                                            onChange={(e) => setMaxPriceFilter(e.target.value)}
                                            className="w-full bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl pl-6 pr-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock Status Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Stock Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'all', label: 'All Items' },
                                        { id: 'in_stock', label: 'In Stock Only' },
                                        { id: 'low_stock', label: 'Low Stock Only' },
                                        { id: 'out_of_stock', label: 'Out of Stock' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setStockStatusFilter(opt.id as any)}
                                            className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${stockStatusFilter === opt.id
                                                ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                                : 'bg-white dark:bg-black/25 border-[#E2DCCE] dark:border-emerald-950/20 text-[#4D6E56] dark:text-stone-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Filter */}
                            {availableBrands.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Brands</label>
                                    <div className="max-h-36 overflow-y-auto border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-3 bg-white/50 dark:bg-black/10 space-y-2 scrollbar-hide">
                                        {availableBrands.map(brand => {
                                            const isChecked = selectedBrands.includes(brand);
                                            return (
                                                <label key={brand} className="flex items-center gap-2.5 text-xs text-[#1E3F27] dark:text-[#EAE5D9] cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            if (isChecked) {
                                                                setSelectedBrands(prev => prev.filter(b => b !== brand));
                                                            } else {
                                                                setSelectedBrands(prev => [...prev, brand]);
                                                            }
                                                        }}
                                                        className="w-3.5 h-3.5 accent-[#2C5E3B] rounded cursor-pointer"
                                                    />
                                                    <span>{brand}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sales Velocity */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Sales Velocity</label>
                                <div className="flex gap-2">
                                    {['High', 'Medium', 'Low'].map(vel => {
                                        const isChecked = selectedVelocities.includes(vel);
                                        return (
                                            <button
                                                key={vel}
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSelectedVelocities(prev => prev.filter(v => v !== vel));
                                                    } else {
                                                        setSelectedVelocities(prev => [...prev, vel]);
                                                    }
                                                }}
                                                className={`flex-1 py-2 rounded-xl border text-[11px] font-bold transition-all ${isChecked
                                                    ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-sm'
                                                    : 'bg-white dark:bg-black/25 border-[#E2DCCE] dark:border-emerald-950/20 text-[#4D6E56] dark:text-stone-300'
                                                }`}
                                            >
                                                {vel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Offers & Promotions Toggle Buttons */}
                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-black uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">Offers & Status</label>
                                <div className="space-y-2 bg-white/50 dark:bg-black/10 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#1E3F27] dark:text-[#EAE5D9]">🏷️ On Sale Only</span>
                                        <button
                                            onClick={() => setOnSaleOnly(!onSaleOnly)}
                                            title="Toggle On Sale Only"
                                            aria-label="Toggle On Sale Only"
                                            className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${onSaleOnly ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
                                        >
                                            <span className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-all ${onSaleOnly ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#E2DCCE]/50 dark:border-emerald-950/10 pt-2">
                                        <span className="text-xs text-[#1E3F27] dark:text-[#EAE5D9]">⚖️ Competitor Price Matched</span>
                                        <button
                                            onClick={() => setCompetitorMatchedOnly(!competitorMatchedOnly)}
                                            title="Toggle Competitor Price Matched"
                                            aria-label="Toggle Competitor Price Matched"
                                            className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${competitorMatchedOnly ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
                                        >
                                            <span className={`w-4 h-4 rounded-full bg-white shadow-sm absolute transition-all ${competitorMatchedOnly ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Actions */}
                        <div className="p-4 border-t border-[#E2DCCE] dark:border-emerald-950/30 bg-white/70 dark:bg-black/30 flex gap-3">
                            <button
                                onClick={resetAllFilters}
                                className="flex-1 py-3 border border-[#E2DCCE] dark:border-emerald-950/20 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                <RotateCcw size={14} />
                                Reset All
                            </button>
                            <button
                                onClick={() => setIsFilterPanelOpen(false)}
                                className="flex-1 py-3 bg-[#2C5E3B] text-white hover:bg-[#1E3F27] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
