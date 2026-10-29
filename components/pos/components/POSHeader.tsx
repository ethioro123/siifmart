import { PriceUpdatesModal } from '../modals/PriceUpdatesModal';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, ArrowRight, X, Link,
    RefreshCw, WifiOff, CloudOff, CheckCircle, Trophy, SlidersHorizontal, ScanBarcode
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
        userBonusShare
    } = usePOS();

    const { triggerSync, posSyncStatus, posPendingSyncCount, posLatencyMs, settings, activeSite, effectiveCountry } = useData();
    const activeCountry = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;

    // Helper to check for Neutralino (native app mode)
    const isNativeApp = typeof window !== 'undefined' && (window as any).Neutralino;

    return (
        <div className="flex items-center gap-2.5 sm:gap-3">
            <button
                type="button"
                onClick={() => navigate('/')}
                title={t('pos.exitDashboard')}
                aria-label="Exit to Dashboard"
                className="hidden lg:flex min-h-11 min-w-11 items-center justify-center p-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] rounded-xl text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] shadow-2xs"
            >
                <div className="w-5 h-5 text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors">
                    <ArrowLeft size={16} />
                </div>
            </button>
            <div className="flex-1 relative">
                <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 py-2 focus-within:border-[var(--theme-border-focus)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/20 focus-within:bg-[var(--theme-bg-card)] transition-all group shadow-2xs">
                    <div className="w-5 h-5 text-[var(--theme-text-secondary)] flex items-center justify-center shrink-0 group-focus-within:text-[var(--theme-accent)] transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        aria-label={t('pos.searchProducts') || 'Search or scan products'}
                        placeholder={t('pos.searchProducts') || 'Search products or scan barcode...'}
                        className="bg-transparent border-none ml-2.5 flex-1 text-[var(--theme-text-primary)] outline-none placeholder-[var(--theme-text-muted)] font-medium text-sm min-w-0 tracking-tight"
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
                            className="ml-1.5 min-h-8 min-w-8 rounded-full hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            aria-label="Clear Search"
                        >
                            <X size={14} />
                        </button>
                    ) : null}
                    {!searchTerm && (
                        <div className="hidden sm:flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[10px] font-mono font-medium text-[var(--theme-text-muted)] select-none">
                                <ScanBarcode size={11} className="text-blue-500" />
                                <span>{t('pos.scan')}</span>
                            </div>
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[10px] font-mono font-medium text-[var(--theme-text-muted)] select-none">
                                <span>⌘</span><span>K</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-end gap-2 [&:empty]:hidden">
                <PriceUpdatesModal />
                </div>

                {/* Unknown Barcode Alert */}
                {unknownBarcode && (
                    <div role="alert" className="absolute left-0 right-0 top-full mt-2 z-50">
                        <div className="bg-[var(--theme-bg-card)] border border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
                            <button
                                type="button"
                                onClick={() => setUnknownBarcode('')}
                                className="absolute top-2 right-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
                                        type="button"
                                        onClick={() => setUnknownBarcode('')}
                                        className="min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                                    >
                                        {t('pos.dismiss')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCapturedBarcodeForModal(unknownBarcode);
                                            setIsUnknownBarcodeModalOpen(true);
                                        }}
                                        className="min-h-11 px-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
                type="button"
                onClick={() => setIsFilterPanelOpen(true)}
                aria-label={`Filter and sort${activeFiltersCount ? `, ${activeFiltersCount} active` : ''}`}
                className="relative min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-all flex items-center gap-2 shrink-0 tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] shadow-2xs"
            >
                <div className="w-5 h-5 text-[var(--theme-text-secondary)] flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={14} />
                </div>
                <span className="hidden sm:inline">{t('pos.filterAndSort')}</span>
                {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-full flex items-center justify-center text-[10px] font-bold">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Sync Status Badge */}
            <div className="hidden md:block shrink-0">
                <button
                    type="button"
                    onClick={() => triggerSync()}
                    aria-label={`Sync point of sale${posSyncStatus === 'offline' ? ', offline' : posSyncStatus === 'syncing' ? ', syncing' : (posPendingSyncCount || 0) > 0 ? `, ${posPendingSyncCount} pending` : ', online'}`}
                    className={`min-h-11 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all tracking-tight shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${posSyncStatus === 'offline' ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)]' :
                        posSyncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                            (posPendingSyncCount || 0) > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                'bg-[var(--theme-bg-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                         }`}
                    title={posLatencyMs ? `Server Latency: ${posLatencyMs}ms (Click to force sync)` : 'Click to force sync'}
                >
                    {posSyncStatus === 'syncing' ? (
                        <RefreshCw size={13} className="animate-spin text-blue-500" />
                    ) : posSyncStatus === 'offline' ? (
                        <WifiOff size={13} className="text-rose-500" />
                    ) : (posPendingSyncCount || 0) > 0 ? (
                        <CloudOff size={13} className="text-amber-500" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                    <span className="hidden lg:inline text-[11px] font-medium">
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

            {/* Store Bonus Widget */}
            {settings.posBonusEnabled !== false && currentStorePoints && storeBonus && (
                <div className="relative group hidden lg:block shrink-0">
                    <div className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border-subtle)] rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--theme-text-primary)] cursor-pointer transition-all shadow-2xs">
                        <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Trophy size={13} />
                        </div>
                        <span className="font-mono tabular-nums text-[11px] tracking-tight">{currentStorePoints.monthlyPoints.toLocaleString()} {t('pos.pts')}</span>
                    </div>

                    {/* Popover Breakdown on Hover */}
                    <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-56 p-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{t('pos.teamBonus')}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                                {storeBonus.tier.tierName}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                            {currentStorePoints.monthlyPoints.toLocaleString()} {t('pos.pts')}
                        </p>
                        {userBonusShare && (
                            <div className="mt-2 pt-2 border-t border-[var(--theme-border-subtle)] flex items-center justify-between">
                                <span className="text-xs text-[var(--theme-text-secondary)]">{t('pos.yourShare')}</span>
                                <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
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
