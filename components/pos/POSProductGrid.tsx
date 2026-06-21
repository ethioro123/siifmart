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
        <div className="flex-1 flex flex-col bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] overflow-hidden pb-20 lg:pb-0 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] backdrop-blur-2xl transition-all duration-300 relative">
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
                                placeholder="Search products or scan barcode..."
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
                                    Team Bonus
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
                                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83]">{currentStorePoints.monthlyPoints.toLocaleString()} pts</p>
                            </div>
                            {userBonusShare && (
                                <div className="text-right pl-2 border-l border-[#2C5E3B]/20">
                                    <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                                        {formatCompactNumber(userBonusShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-[#4D6E56] dark:text-gray-500">your share</p>
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
                            className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 ${selectedCategory === cat
                                ? 'bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white shadow-sm'
                                : 'text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20'
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
                                className={`text-left bg-white/70 dark:bg-[#18201B]/30 border border-[#E2DCCE] dark:border-emerald-950/10 rounded-2xl p-4 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 hover:bg-white dark:hover:bg-[#18201B]/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full active:scale-[0.98] shadow-sm hover:shadow-md ${product.stock === 0 ? 'opacity-35 grayscale cursor-not-allowed' : ''}`}
                            >
                                <div className="aspect-square rounded-xl bg-[#F4F0E6] dark:bg-black/35 mb-4 overflow-hidden relative border border-[#E2DCCE]/40 dark:border-white/5 flex items-center justify-center">
                                    {product.image && !product.image.includes('placeholder.com') ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full bg-[#F4F0E6] dark:bg-black/35 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#2C5E3B]/30 dark:text-[#A9CBA2]/30"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                            }}
                                        />
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
                                             colorClasses = 'bg-red-500/15 text-red-500 border-red-500/35';
                                         } else if (isLowStock) {
                                             colorClasses = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35';
                                         }

                                         return (
                                             <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider backdrop-blur-md border shadow-sm flex items-center gap-1 ${colorClasses}`}>
                                                 {product.stock.toLocaleString(undefined, { maximumFractionDigits: getSellUnit(product.unit).category === 'count' ? 0 : 2 })}
                                                 <span className="text-[7px] opacity-70 uppercase">{getSellUnit(product.unit).shortLabel}</span>
                                             </div>
                                         );
                                      })()}

                                    {product.isOnSale && (
                                        <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-wider shadow-sm">
                                            {t('pos.sale')}
                                        </div>
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
                )}
            </div>
        </div>
    );
};
