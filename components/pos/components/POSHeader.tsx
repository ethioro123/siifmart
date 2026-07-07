import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, ArrowRight, X, Link, ShoppingBag,
    RefreshCw, WifiOff, CloudOff, CheckCircle, Trophy, SlidersHorizontal
} from 'lucide-react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Protected } from '../../Protected';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';

interface POSHeaderProps {
    setIsFilterPanelOpen: (open: boolean) => void;
    activeFiltersCount: number;
}

export const POSHeader: React.FC<POSHeaderProps> = ({ setIsFilterPanelOpen, activeFiltersCount }) => {
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
        userBonusShare
    } = usePOS();

    const { triggerSync, posSyncStatus, posPendingSyncCount, settings } = useData();

    // Helper to check for Neutralino (native app mode)
    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;

    return (
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

                {/* Unknown Barcode Alert */}
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
                <SlidersHorizontal size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
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
                                'bg-[#2C5E3B]/10 border-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'
                         }`}
                >
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
    );
};
