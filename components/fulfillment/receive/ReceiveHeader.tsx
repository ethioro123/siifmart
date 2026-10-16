import React, { useState } from 'react';
import { Scan, AlertTriangle, X, Truck, Search, Plus, Minus, Loader2 } from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { useScanOnly } from '../../../hooks/useScanOnly';

interface ReceiveHeaderProps {
    scanInputRef: React.RefObject<HTMLInputElement | null>;
    handleGlobalScan: (val: string) => void;
    unresolvedScans: Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>;
    setUnresolvedScans: React.Dispatch<React.SetStateAction<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>>;
    setReceivingPO: (po: PurchaseOrder | null) => void;
    filteredReceiveOrders: PurchaseOrder[];
    receiveSearch: string;
    setReceiveSearch: (val: string) => void;
    setResolvingBarcode: (val: { barcode: string; qty: number } | null) => void;
    setResolutionSearch: (val: string) => void;
    setResolutionMode: (val: 'map' | 'new' | 'hold') => void;
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    orders: PurchaseOrder[];
    t: (key: string) => string;
    isSubmitting: boolean;
}

export const ReceiveHeader: React.FC<ReceiveHeaderProps> = ({
    scanInputRef,
    handleGlobalScan,
    unresolvedScans,
    setUnresolvedScans,
    setReceivingPO,
    filteredReceiveOrders,
    receiveSearch,
    setReceiveSearch,
    setResolvingBarcode,
    setResolutionSearch,
    setResolutionMode,
    viewMode,
    setViewMode,
    orders,
    t,
    isSubmitting
}) => {
    const [scanVal, setScanVal] = useState('');
    const scanOnlyHandlers = useScanOnly(setScanVal);

    return (
        <div className="space-y-1.5 sm:space-y-4 shrink-0 mb-1.5 sm:mb-2">
            {/* UNIFIED RECEIVE HEADER CARD */}
            <div className="p-2 sm:p-4 md:p-5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl sm:rounded-2xl shadow-xs shrink-0 relative overflow-hidden">
                {/* Global Scan Input */}
                <div className="flex gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                    <div className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none">
                            <Scan size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <input
                            ref={scanInputRef}
                            autoFocus
                            type="text"
                            value={scanVal}
                            onChange={(e) => setScanVal(e.target.value)}
                            onKeyDown={(e) => {
                                scanOnlyHandlers.onKeyDown(e);
                                if (e.key === 'Enter') {
                                    const val = scanVal.trim();
                                    if (val) {
                                        handleGlobalScan(val);
                                        setScanVal('');
                                    }
                                }
                            }}
                            onPaste={scanOnlyHandlers.onPaste}
                            aria-label={t('warehouse.scanBarcodeOrSku')}
                            title={t('warehouse.scanBarcodeOrSku')}
                            placeholder={t('warehouse.scanBarcodeOrSku')}
                            className="w-full h-9 sm:h-12 pl-9 sm:pl-12 pr-3 sm:pr-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-lg sm:rounded-xl text-[var(--theme-text-primary)] font-mono text-xs sm:text-sm focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent-muted)] focus:outline-none transition-colors placeholder:text-[var(--theme-text-secondary)]/60"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (isSubmitting) return;
                            const val = scanVal.trim() || (scanInputRef.current ? scanInputRef.current.value.trim() : '');
                            if (val) {
                                handleGlobalScan(val);
                                setScanVal('');
                            }
                        }}
                        disabled={isSubmitting}
                        className="h-9 sm:h-12 px-3 sm:px-8 bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs tracking-wide rounded-lg sm:rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 shrink-0 touch-manipulation cursor-pointer"
                    >
                        {isSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <span className="hidden sm:inline">{t('warehouse.submitScan')}</span>
                                <span className="sm:hidden">{t('warehouse.goScan')}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Controls row */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                    {/* Left: Mobile Dot Indicator / Desktop title */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                <Truck size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                    {t('warehouse.receivingQueue')}
                                </h3>
                            </div>
                        </div>

                        {/* Mobile dot indicator */}
                        <div className="flex items-center gap-1.5 min-w-0 sm:hidden">
                            <Truck size={13} className="text-[var(--theme-accent)] shrink-0" />
                            <span className="text-xs font-bold text-[var(--theme-text-primary)]">Queue</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {filteredReceiveOrders.length}
                            </span>
                        </div>

                        {/* View Mode Toggle on mobile sits inline */}
                        <div className="p-0.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg flex items-center select-none shrink-0 sm:hidden">
                            <button
                                type="button"
                                onClick={() => setViewMode('Process')}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer min-h-[26px] flex items-center justify-center ${
                                    viewMode === 'Process'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)]'
                                }`}
                            >
                                {t('warehouse.process')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('History')}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer min-h-[26px] flex items-center justify-center ${
                                    viewMode === 'History'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)]'
                                }`}
                            >
                                {t('warehouse.history')}
                            </button>
                        </div>
                    </div>

                    {/* Desktop View Mode + Search */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl items-center select-none">
                            <button
                                type="button"
                                onClick={() => setViewMode('Process')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'History'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {t('warehouse.history')}
                            </button>
                        </div>

                        {viewMode === 'Process' && (
                            <div className="relative flex-1 sm:flex-initial">
                                <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                                    <Search size={13} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('warehouse.searchManifestSupplier')}
                                    aria-label={t('warehouse.searchManifestSupplier')}
                                    title={t('warehouse.searchManifestSupplier')}
                                    value={receiveSearch}
                                    onChange={(e) => setReceiveSearch(e.target.value)}
                                    className="w-full sm:w-56 min-h-[30px] sm:min-h-0 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg sm:rounded-xl py-1 pl-7 sm:pl-8 pr-7 text-xs text-[var(--theme-text-primary)] placeholder:[var(--theme-text-secondary)]/60 focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                                />
                                {receiveSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setReceiveSearch('')}
                                        className="absolute inset-y-0 right-2 flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                                        title="Clear search"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
