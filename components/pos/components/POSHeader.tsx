import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, ArrowRight, X, Link,
    RefreshCw, WifiOff, CloudOff, CheckCircle, Trophy, SlidersHorizontal
} from 'lucide-react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Button from '../../shared/Button';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { native } from '../../../utils/native';

import { CyberClock } from '../../dashboard/widgets/CyberClock';
import type { Country } from '../../../utils/localization';

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
        currentStorePoints,
        storeBonus,
        userBonusShare,
        lastSeenPriceUpdate,
        markPriceUpdatesAsRead,
        setIsPriceUpdatesModalOpen
    } = usePOS();

    const { triggerSync, posSyncStatus, posPendingSyncCount, posLatencyMs, settings, products, activeSite, effectiveCountry } = useData();
    const activeCountry = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;

    // Calculate unseen price changes in active site (last 7 days)
    const siteId = activeSite?.id;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const unseenPriceChanges = products.filter((p: any) => {
        const matchesSite = !siteId || p.siteId === siteId || p.site_id === siteId;
        const priceTime = p.priceUpdatedAt || p.price_updated_at || p.updatedAt || p.updated_at;
        if (!priceTime) return false;
        const ts = new Date(priceTime).getTime();
        return matchesSite && ts > cutoff && ts > (lastSeenPriceUpdate || 0);
    });

    // Helper to check for Neutralino (native app mode)
    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;

    return (
        <div className="flex gap-3">
            <Button
                variant="secondary"
                onClick={() => navigate('/')}
                icon={<ArrowLeft size={18} />}
                title={t('pos.exitDashboard')}
                aria-label="Exit to Dashboard"
                className="hidden lg:flex p-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] active:scale-95 transition-all shadow-xs cursor-pointer"
            />
            <div className="flex-1 relative">
                <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 focus-within:border-[var(--theme-border-focus)] transition-colors group">
                    <Search className="w-4 h-4 text-[var(--theme-text-secondary)] group-focus-within:text-[var(--theme-text-primary)] transition-colors flex-shrink-0" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t('pos.searchProducts')}
                        className="bg-transparent border-none ml-2.5 flex-1 text-[var(--theme-text-primary)] outline-none placeholder-[var(--theme-text-muted)] font-medium text-xs sm:text-sm min-w-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchTerm.trim() ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                if (searchInputRef.current) searchInputRef.current.value = '';
                            }}
                            className="ml-1.5 p-1 rounded-lg hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors flex-shrink-0 cursor-pointer"
                            aria-label="Clear Search"
                        >
                            <X size={15} />
                        </button>
                    ) : null}
                    {unseenPriceChanges.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 ml-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPriceUpdatesModalOpen(true);
                                    native.haptic();
                                }}
                                className="flex items-center gap-1.5 hover:underline cursor-pointer transition-transform active:scale-95"
                                title="Review and confirm product price updates"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {unseenPriceChanges.length} Price {unseenPriceChanges.length === 1 ? 'Change' : 'Changes'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={markPriceUpdatesAsRead}
                                className="ml-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer"
                                title="Dismiss price notifications"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>

                {/* Unknown Barcode Alert */}
                {unknownBarcode && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50">
                        <div className="bg-[var(--theme-bg-card)] border border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => setUnknownBarcode('')}
                                className="absolute top-2 right-2 p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                                aria-label="Dismiss"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-center">
                                    <p className="text-amber-500 text-xs font-semibold mb-1">{t('pos.unknownBarcodeDetected')}</p>
                                    <p className="text-[var(--theme-text-primary)] text-xl font-mono font-bold tracking-wider">{unknownBarcode}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setUnknownBarcode('')}
                                        className="px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        {t('pos.dismiss')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCapturedBarcodeForModal(unknownBarcode);
                                            setIsUnknownBarcodeModalOpen(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                    >
                                        <Link size={13} />
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
                className="relative bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer shrink-0"
            >
                <SlidersHorizontal size={14} className="text-[var(--theme-text-secondary)]" />
                <span className="hidden sm:inline">Filter & Sort</span>
                {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Sync Status Badge */}
            <div className="hidden md:block shrink-0">
                <button
                    onClick={() => triggerSync()}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${posSyncStatus === 'offline' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        posSyncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                            (posPendingSyncCount || 0) > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
                         }`}
                    title={posLatencyMs ? `Server Latency: ${posLatencyMs}ms (Click to force sync)` : 'Click to force sync'}
                >
                    {posSyncStatus === 'syncing' ? (
                        <RefreshCw size={13} className="animate-spin" />
                    ) : posSyncStatus === 'offline' ? (
                        <WifiOff size={13} />
                    ) : (posPendingSyncCount || 0) > 0 ? (
                        <CloudOff size={13} />
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    <span className="hidden lg:inline text-[11px]">
                        {posSyncStatus === 'offline' ? t('pos.offline') :
                            posSyncStatus === 'syncing' ? t('pos.syncing') :
                                (posPendingSyncCount || 0) > 0 ? t('pos.syncPending') :
                                    posLatencyMs ? `${posLatencyMs}ms` : t('pos.online')}
                        {((posPendingSyncCount || 0) > 0) && ` (${posPendingSyncCount})`}
                    </span>
                </button>
            </div>

            {/* Sovereign Terminal Clock */}
            <div className="hidden xl:flex items-center shrink-0">
                <CyberClock country={activeCountry} compact showCalendar={false} />
            </div>

            {/* Store Bonus Widget - Compact Apple Liquid Glass Pill with Hover Breakdown */}
            {settings.posBonusEnabled !== false && currentStorePoints && storeBonus && (
                <div className="relative group hidden lg:block shrink-0">
                    <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--theme-text-primary)] cursor-pointer transition-colors shadow-xs">
                        <Trophy size={14} className="text-amber-500 shrink-0" />
                        <span className="font-mono tabular-nums text-[11px]">{currentStorePoints.monthlyPoints.toLocaleString()} {t('pos.pts')}</span>
                    </div>

                    {/* Popover Breakdown on Hover */}
                    <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-56 p-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[var(--theme-text-primary)]">{t('pos.teamBonus')}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                                {storeBonus.tier.tierName}
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            {currentStorePoints.monthlyPoints.toLocaleString()} {t('pos.pts')}
                        </p>
                        {userBonusShare && (
                            <div className="mt-2 pt-2 border-t border-[var(--theme-border)] flex items-center justify-between">
                                <span className="text-[10px] text-[var(--theme-text-secondary)]">{t('pos.yourShare')}</span>
                                <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)]">
                                    {formatCompactNumber(userBonusShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
