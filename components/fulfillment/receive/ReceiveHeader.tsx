import React from 'react';
import { Scan, X, Truck, Loader2, MapPin } from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { FulfillmentHeaderMetrics } from '../FulfillmentHeaderMetrics';
import { useData } from '../../../contexts/DataContext';

interface ReceiveHeaderProps {
    scanInputRef: React.RefObject<HTMLInputElement | null>;
    handleGlobalScan: (val: string) => void;
    filteredReceiveOrders: PurchaseOrder[];
    receiveSearch: string;
    setReceiveSearch: (val: string) => void;
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    t: (key: string) => string;
    isSubmitting: boolean;
    receiveStats?: {
        pending: number;
        active: number;
        completed: number;
    };
    // Backwards-compatible optional props
    unresolvedScans?: Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>;
    setUnresolvedScans?: React.Dispatch<React.SetStateAction<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>>;
    setReceivingPO?: (po: PurchaseOrder | null) => void;
    setResolvingBarcode?: (val: { barcode: string; qty: number } | null) => void;
    setResolutionSearch?: (val: string) => void;
    setResolutionMode?: (val: 'map' | 'new' | 'hold') => void;
    orders?: PurchaseOrder[];
}

export const ReceiveHeader: React.FC<ReceiveHeaderProps> = ({
    scanInputRef,
    handleGlobalScan,
    filteredReceiveOrders,
    receiveSearch,
    setReceiveSearch,
    viewMode,
    setViewMode,
    t,
    isSubmitting,
    receiveStats
}) => {
    const { activeSite } = useData();

    const handleSubmit = () => {
        if (isSubmitting) return;
        const val = receiveSearch.trim();
        if (val) {
            handleGlobalScan(val);
        }
    };

    return (
        <div className="space-y-1.5 sm:space-y-4 shrink-0 mb-1.5 sm:mb-2">
            {/* UNIFIED RECEIVE HEADER CARD - Sticky on mobile */}
            <div className="p-2.5 sm:p-4 md:p-5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl sm:rounded-2xl shadow-xs shrink-0 relative sticky top-0 z-20">
                {/* Mobile Active Receiving Location Indicator */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={13} className="text-[var(--theme-accent)] shrink-0" />
                        <span className="font-semibold text-[var(--theme-text-secondary)] uppercase text-[10px] tracking-wider shrink-0">
                            {t('warehouse.receivingAt') || 'Receiving Location'}:
                        </span>
                        <span className="font-bold text-[var(--theme-text-primary)] truncate font-mono text-xs">
                            {activeSite?.name || 'Inbound Dock'}
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--theme-text-secondary)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                        {activeSite?.code || 'DOCK-1'}
                    </span>
                </div>

                {/* Unified Smart Scan & Search Bar */}
                <div className="flex gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none flex items-center">
                            <Scan size={16} className="text-[var(--theme-accent)] sm:w-5 sm:h-5" />
                        </div>
                        <input
                            ref={scanInputRef}
                            autoFocus
                            type="text"
                            value={receiveSearch}
                            onChange={(e) => setReceiveSearch(e.target.value)}
                            onFocus={(e) => {
                                const target = e.currentTarget;
                                setTimeout(() => {
                                    target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                                }, 150);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit();
                                }
                            }}
                            aria-label={t('warehouse.scanBarcodeOrSku')}
                            title={t('warehouse.scanBarcodeOrSku')}
                            placeholder={t('warehouse.searchReceivePlaceholder') || 'Scan barcode / SKU, or search PO, supplier...'}
                            autoComplete="off"
                            className="w-full min-h-11 sm:min-h-12 pl-9 sm:pl-12 pr-10 sm:pr-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-xl text-[var(--theme-text-primary)] font-medium text-xs sm:text-sm focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent-muted)] focus:outline-none transition-colors placeholder:text-[var(--theme-text-secondary)]/60 scroll-mt-20 scroll-mb-20"
                        />
                        {receiveSearch && (
                            <button
                                type="button"
                                onClick={() => setReceiveSearch('')}
                                className="absolute inset-y-0 right-1 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer p-1 min-h-[44px] min-w-[44px] touch-manipulation"
                                title={t('warehouse.clearSearch') || 'Clear search'}
                                aria-label={t('warehouse.clearSearch') || 'Clear search'}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !receiveSearch.trim()}
                        className="min-h-11 sm:min-h-12 px-3 sm:px-6 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 font-semibold text-xs tracking-wide rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 shrink-0 touch-manipulation cursor-pointer shadow-xs min-w-[70px] sm:min-w-[90px]"
                    >
                        {isSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <Scan size={14} className="shrink-0 sm:hidden" />
                                <span className="hidden sm:inline">{t('warehouse.submitScan')}</span>
                                <span className="sm:hidden">{t('warehouse.goScan')}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-2">
                    {/* Left: Mobile Dot Indicator / Desktop title */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden md:flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                <Truck size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                    {t('warehouse.receivingQueue')}
                                </h3>
                            </div>
                        </div>

                        {/* Mobile queue indicator */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Truck size={13} className="text-[var(--theme-accent)] shrink-0 sm:hidden" />
                            <span className="text-xs font-bold text-[var(--theme-text-primary)] md:hidden">{t('warehouse.queueShort') || 'Queue'}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-text)]" />
                                {filteredReceiveOrders.length}
                            </span>
                        </div>
                    </div>

                    {/* Desktop Center: Apple Design Metrics */}
                    {receiveStats && (
                        <FulfillmentHeaderMetrics
                            pending={receiveStats.pending}
                            active={receiveStats.active}
                            completed={receiveStats.completed}
                            labels={{
                                pending: t('warehouse.pending') || 'Pending',
                                active: t('warehouse.inProgress') || 'In Progress',
                                completed: t('warehouse.completed') || 'Completed'
                            }}
                        />
                    )}

                    {/* Right: View Mode Toggle */}
                    <div className="p-0.5 sm:p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg sm:rounded-xl flex items-center select-none shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode('Process')}
                            className={`px-3 sm:px-3.5 py-1.5 rounded-md sm:rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-11 sm:min-h-8 flex items-center justify-center touch-manipulation ${
                                viewMode === 'Process'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.process')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('History')}
                            className={`px-3 sm:px-3.5 py-1.5 rounded-md sm:rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-11 sm:min-h-8 flex items-center justify-center touch-manipulation ${
                                viewMode === 'History'
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.history')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
