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
    RefreshCw, WifiOff, CloudOff, CheckCircle, Trophy, Box, Package, Plus
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
    } = usePOS();

    const { triggerSync, posSyncStatus, posPendingSyncCount, settings } = useData();

    // Helper to check for Neutralino (native app mode)
    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;
    const native = isNativeApp ? (window as any).Neutralino.os : null;

    return (
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-2xl overflow-hidden pb-20 lg:pb-0 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/')}
                        icon={<ArrowLeft size={20} />}
                        title={t('pos.exitDashboard')}
                        aria-label="Exit to Dashboard"
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors"
                    />
                    <div className="flex-1 relative">
                        <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-cyber-primary/40 focus-within:bg-white/[0.06] transition-all duration-200 group">
                            <Search className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-primary transition-colors flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search products or scan barcode..."
                                className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-600 font-medium min-w-0"
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
                                    className="ml-2 p-1.5 rounded-lg bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary transition-colors flex-shrink-0"
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
                                            <p className="text-yellow-400 text-sm font-medium mb-1">Unknown Barcode Detected</p>
                                            <p className="text-yellow-300 text-2xl font-mono font-bold tracking-wider">{unknownBarcode}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setUnknownBarcode('')}
                                                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                                            >
                                                Dismiss
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCapturedBarcodeForModal(unknownBarcode);
                                                    setIsUnknownBarcodeModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                            >
                                                <Link size={14} />
                                                Link Barcode
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Protected permission="ADD_PRODUCT">
                        <Button
                            variant="secondary"
                            onClick={() => setIsMiscItemModalOpen(true)}
                            icon={<ShoppingBag size={16} />}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                            {t('pos.miscItem')}
                        </Button>
                    </Protected>
                    <div className="hidden md:block">
                        {/* Sync Status Badge */}
                        <button
                            onClick={() => triggerSync()}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 hover:scale-105 active:scale-95 ${posSyncStatus === 'offline' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                posSyncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                    (posPendingSyncCount || 0) > 0 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                        'bg-green-500/10 border-green-500/20 text-green-500' // Synced state
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
                                {posSyncStatus === 'offline' ? 'Offline' :
                                    posSyncStatus === 'syncing' ? 'Syncing...' :
                                        (posPendingSyncCount || 0) > 0 ? 'Sync Pending' :
                                            'Online'}
                                {((posPendingSyncCount || 0) > 0) && ` (${posPendingSyncCount} queued)`}
                            </span>
                        </button>
                    </div>

                    {/* Store Bonus Widget */}
                    {settings.posBonusEnabled !== false && currentStorePoints && storeBonus && (
                        <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                                storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                                    storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                                        storeBonus.tier.tierColor === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                                            storeBonus.tier.tierColor === 'purple' ? 'from-purple-400 to-purple-600' :
                                                'from-gray-400 to-gray-500'
                                } flex items-center justify-center`}>
                                <Trophy size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                    Team Bonus
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r ${storeBonus.tier.tierColor === 'gray' ? 'from-gray-400 to-gray-500' :
                                        storeBonus.tier.tierColor === 'amber' ? 'from-amber-500 to-amber-600' :
                                            storeBonus.tier.tierColor === 'yellow' ? 'from-yellow-400 to-yellow-500' :
                                                storeBonus.tier.tierColor === 'cyan' ? 'from-cyan-400 to-cyan-500' :
                                                    storeBonus.tier.tierColor === 'purple' ? 'from-purple-400 to-purple-600' :
                                                        'from-gray-400 to-gray-500'
                                        } text-white`}>
                                        {storeBonus.tier.tierName}
                                    </span>
                                </p>
                                <p className="text-[10px] text-gray-400">{currentStorePoints.monthlyPoints.toLocaleString()} pts</p>
                            </div>
                            {userBonusShare && (
                                <div className="text-right pl-2 border-l border-green-500/30">
                                    <p className="text-xs text-green-400 font-bold">
                                        {formatCompactNumber(userBonusShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-gray-500">your share</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide px-1 -mx-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                                ? 'bg-cyber-primary text-black'
                                : 'text-gray-500 hover:text-white hover:bg-white/[0.06] bg-white/[0.03]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <Box size={64} className="text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{t('pos.noProductsAvailable')}</h3>
                        <p className="text-gray-400 max-w-md">
                            {t('pos.productsWillAppear')}
                            <br />
                            <button
                                onClick={() => navigate('/pos-dashboard')}
                                className="text-cyber-primary hover:underline mt-2 font-medium"
                            >
                                {t('pos.goToPOSCommand')}
                            </button>
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    addToCart(product);
                                    if (isNativeApp && native) {
                                        native.vibrate(50);
                                    }
                                }}
                                disabled={product.stock === 0}
                                className={`text-left bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 hover:border-cyber-primary/40 hover:bg-white/[0.07] transition-all duration-200 group relative overflow-hidden flex flex-col h-full active:scale-[0.97] ${product.stock === 0 ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                            >
                                <div className="aspect-square rounded-xl bg-black/30 mb-3 overflow-hidden relative">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full bg-white/[0.03] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-white/10"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                                            <Package size={32} className="text-white/10" />
                                        </div>
                                    )}

                                    {/* Stock indicator */}
                                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1 ${product.stock <= 5 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-black/40 text-gray-300 border-white/10'}`}>
                                        {product.stock.toLocaleString(undefined, { maximumFractionDigits: getSellUnit(product.unit).category === 'count' ? 0 : 2 })}
                                        <span className="text-[8px] opacity-70">{getSellUnit(product.unit).shortLabel}</span>
                                    </div>

                                    {product.isOnSale && (
                                        <div className="absolute top-2 left-2 bg-cyber-primary px-2 py-0.5 rounded-md text-[8px] font-black text-black uppercase tracking-wider">
                                            {t('pos.sale')}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-semibold text-white text-xs md:text-sm line-clamp-2 min-h-[2.25rem] leading-tight">{product.name}</h3>
                                    <div className="mt-auto pt-2 flex items-center justify-between">
                                        <div className="flex items-baseline gap-1.5">
                                            {product.isOnSale && product.salePrice ? (
                                                <>
                                                    <p className="text-cyber-primary font-bold text-base">{CURRENCY_SYMBOL} {product.salePrice}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[9px] text-cyber-primary/60 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                                    <p className="text-gray-600 text-[10px] line-through">{CURRENCY_SYMBOL} {product.price}</p>
                                                </>
                                            ) : (
                                                <p className="text-white font-bold text-base">{CURRENCY_SYMBOL} {product.price}{product.unit && getSellUnit(product.unit).code !== 'UNIT' ? <span className="text-[9px] text-gray-500 font-bold">/{getSellUnit(product.unit).shortLabel}</span> : null}</p>
                                            )}
                                        </div>
                                        <div className="w-7 h-7 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Plus size={14} className="text-cyber-primary" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
