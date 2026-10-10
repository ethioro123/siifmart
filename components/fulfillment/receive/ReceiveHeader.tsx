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
        <div className="space-y-4 shrink-0">
            {/* Global Scan Input for Active Receive */}
            <div className="p-4 md:p-5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-[var(--shadow-sm)] shrink-0 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none">
                            <Scan size={20} />
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
                            className="w-full h-12 pl-12 pr-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-xl text-[var(--theme-text-primary)] font-mono text-sm focus:border-[#0071E3] dark:focus:border-[#2997FF] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-colors placeholder:text-[var(--theme-text-secondary)]/60"
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
                        className="h-12 px-6 sm:px-8 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 text-white font-semibold text-xs tracking-wide rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 min-w-[100px] touch-manipulation cursor-pointer"
                    >
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <span className="hidden sm:inline">{t('warehouse.submitScan')}</span>
                                <span className="sm:hidden">{t('warehouse.goScan')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* UNRESOLVED ITEMS QUEUE */}
            {unresolvedScans.length > 0 && (
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 md:p-5 shrink-0 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 md:mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider leading-none mb-1">
                                    {t('warehouse.unresolvedBarcodes')}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                        {t('warehouse.scanDiagnostics')}
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-full border border-amber-500/20 font-mono tabular-nums">
                                        {unresolvedScans.length}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUnresolvedScans([])}
                            className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium transition-colors hover:underline cursor-pointer"
                        >
                            {t('warehouse.clearAllScans')}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unresolvedScans.map((scan, idx) => (
                            <div
                                key={idx}
                                className="px-3.5 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:border-[var(--theme-border-strong)] cursor-pointer transition-colors shadow-[var(--shadow-sm)] flex items-center gap-3 min-h-[44px] max-w-full overflow-hidden"
                                onClick={() => {
                                    if (filteredReceiveOrders.length === 1) {
                                        setReceivingPO(filteredReceiveOrders[0]);
                                    } else if (filteredReceiveOrders.length > 0 && receiveSearch) {
                                        setReceivingPO(filteredReceiveOrders[0]);
                                    }
                                    setResolvingBarcode({ barcode: scan.barcode, qty: scan.qty });
                                    setResolutionSearch('');
                                    setResolutionMode('map');
                                }}
                                aria-label={`Resolve barcode ${scan.barcode}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] font-mono truncate max-w-[120px] sm:max-w-none">
                                        {scan.barcode}
                                    </span>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                                        {t('warehouse.qtyLabel')}: {scan.qty}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-8 text-center font-mono font-semibold text-[var(--theme-text-primary)] text-sm tabular-nums" aria-live="polite">
                                        {scan.qty}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUnresolvedScans(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 hover:bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer"
                                    title={t('warehouse.removeScan')}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RECEIVE INTELLIGENCE HEADER */}
            <div className="p-4 md:p-5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-[var(--shadow-sm)] relative overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                    <div className="hidden md:flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 dark:border-[#2997FF]/20 flex items-center justify-center shrink-0">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                {t('warehouse.receivingQueue')}
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                                {t('warehouse.approvedPOsWillAppear')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        {/* VIEW MODE TOGGLE */}
                        <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center select-none">
                            <button
                                type="button"
                                onClick={() => setViewMode('Process')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'Process'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {t('warehouse.process')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('History')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'History'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {t('warehouse.history')}
                            </button>
                        </div>

                        {viewMode === 'Process' && (
                            <>
                                <div className="relative flex-1 sm:flex-none">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t('warehouse.searchManifestSupplier')}
                                        aria-label={t('warehouse.searchManifestSupplier')}
                                        title={t('warehouse.searchManifestSupplier')}
                                        value={receiveSearch}
                                        onChange={(e) => setReceiveSearch(e.target.value)}
                                        className="w-full sm:w-64 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-xl py-2 pl-9 pr-8 text-xs text-[var(--theme-text-primary)] placeholder:[var(--theme-text-secondary)]/60 focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-colors"
                                    />
                                    {receiveSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setReceiveSearch('')}
                                            className="absolute inset-y-0 right-2.5 flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                                            title="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="hidden md:flex">
                                    <div className="px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex flex-col justify-center">
                                        <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">
                                            {t('warehouse.pendingManifests')}
                                        </p>
                                        <p className="text-lg font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums leading-none">
                                            {orders.filter(o => o.status === 'Approved').reduce((sum, o) => sum + (o.lineItems?.length || 0), 0)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
