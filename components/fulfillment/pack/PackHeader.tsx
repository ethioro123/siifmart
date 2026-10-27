import React from 'react';
import { Package, Filter, ChevronDown, CheckCircle, AlertTriangle, Clock, List, Search, X, ScanLine, Loader2 } from 'lucide-react';
import { SortDropdown } from '../../shared';
import { FulfillmentHeaderMetrics } from '../FulfillmentHeaderMetrics';

interface PackHeaderProps {
    viewMode: 'Process' | 'History';
    setViewMode: (val: 'Process' | 'History') => void;
    packJobFilter: 'all' | 'pending' | 'in-progress' | 'completed';
    setPackJobFilter: (val: 'all' | 'pending' | 'in-progress' | 'completed') => void;
    isPackFilterDropdownOpen: boolean;
    setIsPackFilterDropdownOpen: (val: boolean) => void;
    packSortBy: 'priority' | 'date' | 'items';
    setPackSortBy: (val: 'priority' | 'date' | 'items') => void;
    isPackSortDropdownOpen: boolean;
    setIsPackSortDropdownOpen: (val: boolean) => void;
    filteredJobsCount?: {
        pending: number;
        active: number;
        completed?: number;
    };
    packSearch: string;
    setPackSearch: (val: string) => void;
    t: (key: string) => string;
    isScanning?: boolean;
    scanSuccess?: string;
    scanError?: string;
    onGlobalScan?: (code?: string) => Promise<void>;
}

export const PackHeader: React.FC<PackHeaderProps> = ({
    viewMode, setViewMode, packJobFilter, setPackJobFilter, isPackFilterDropdownOpen, setIsPackFilterDropdownOpen,
    packSortBy, setPackSortBy, isPackSortDropdownOpen, setIsPackSortDropdownOpen, packSearch, setPackSearch, t,
    filteredJobsCount, isScanning, scanSuccess, scanError, onGlobalScan
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl sm:rounded-2xl p-2.5 sm:p-5 mb-1.5 sm:mb-4 shadow-xs">
            {/* Title row — hidden on mobile to maximize screen real estate */}
            <div className="hidden sm:flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                        <Package size={22} strokeWidth={1.75} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">{t('warehouse.tabs.pack')}</h2>
                        <p className="text-xs font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mt-0.5">{t('warehouse.packDesc')}</p>
                    </div>
                </div>

                {filteredJobsCount && (
                    <FulfillmentHeaderMetrics
                        pending={filteredJobsCount.pending}
                        active={filteredJobsCount.active}
                        completed={filteredJobsCount.completed ?? 0}
                        labels={{
                            pending: t('warehouse.pending') || 'Pending',
                            active: t('warehouse.inProgress') || 'In Progress',
                            completed: t('warehouse.completed') || 'Completed'
                        }}
                    />
                )}
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                    {/* View mode toggle */}
                    <div className="bg-[var(--theme-bg-subtle)] p-0.5 sm:p-1 rounded-xl border border-[var(--theme-border)] flex gap-1 shrink-0 min-h-[36px] sm:min-h-[42px] items-center">
                        <button
                            onClick={() => setViewMode('Process')}
                            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[30px] sm:min-h-[34px] cursor-pointer ${
                                viewMode === 'Process' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.process')}
                        </button>
                        <button
                            onClick={() => setViewMode('History')}
                            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[30px] sm:min-h-[34px] cursor-pointer ${
                                viewMode === 'History' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            {t('warehouse.history')}
                        </button>
                    </div>

                    {/* Mobile Dot Numbers */}
                    {filteredJobsCount && (
                        <div className="flex sm:hidden items-center gap-1.5 px-2 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-[10px] font-mono shrink-0">
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold" title={t('warehouse.activeLabel') || 'Active'}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {filteredJobsCount.active}
                            </span>
                        </div>
                    )}

                    {/* Filter dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsPackFilterDropdownOpen(!isPackFilterDropdownOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider transition-colors min-h-[36px] sm:min-h-[42px] cursor-pointer"
                        >
                            <Filter size={13} className={packJobFilter !== 'all' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'} />
                            <span className="inline truncate max-w-[80px] sm:max-w-[90px]">{packJobFilter === 'all' ? t('warehouse.allStatus') : packJobFilter}</span>
                            <ChevronDown size={13} className={`transition-transform duration-200 text-[var(--theme-text-secondary)] ${isPackFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPackFilterDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsPackFilterDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-xl z-[51] animate-in fade-in zoom-in-95 duration-150">
                                    {['all', 'pending', 'in-progress', 'completed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => { setPackJobFilter(status as any); setIsPackFilterDropdownOpen(false); }}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-between min-h-[38px] cursor-pointer ${
                                                packJobFilter === status ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                            }`}
                                        >
                                            {status === 'all' ? t('warehouse.allStatus') : status}
                                            {packJobFilter === status && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort — desktop only */}
                    <div className="hidden md:block shrink-0">
                        <SortDropdown
                            label={t('warehouse.sortByLabel')}
                            options={[
                                { id: 'priority', label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> },
                                { id: 'date', label: t('warehouse.timeSort'), icon: <Clock size={12} /> },
                                { id: 'items', label: t('warehouse.itemPlural'), icon: <List size={12} /> }
                            ]}
                            value={packSortBy}
                            onChange={(val: any) => setPackSortBy(val)}
                            isOpen={isPackSortDropdownOpen}
                            setIsOpen={setIsPackSortDropdownOpen}
                        />
                    </div>
                </div>

                {/* Smart Unified Search & Barcode Scan Bar */}
                <div className="relative flex-1 min-w-0">
                    <div className="relative flex items-center w-full">
                        <div className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none shrink-0 z-10">
                            {isScanning ? (
                                <Loader2 size={16} className="text-[var(--theme-accent)] animate-spin" />
                            ) : scanSuccess ? (
                                <CheckCircle size={16} className="text-emerald-500" />
                            ) : scanError ? (
                                <AlertTriangle size={16} className="text-red-500" />
                            ) : (
                                <ScanLine size={16} className="text-[var(--theme-accent)]" />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder={t('warehouse.packing.scanBarcodePrompt') || 'Scan barcode / job # or search SKU, order...'}
                            aria-label={t('warehouse.scanPrompt') || 'Scan barcode or search product, SKU, order'}
                            title={t('warehouse.scanPrompt') || 'Scan barcode or search product, SKU, order'}
                            value={packSearch}
                            onChange={(e) => setPackSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = packSearch.trim();
                                    if (val && onGlobalScan) {
                                        onGlobalScan(val);
                                    }
                                }
                            }}
                            autoComplete="off"
                            className={`w-full pl-9 sm:pl-10 text-xs font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/60 border rounded-xl outline-none transition-all min-h-[36px] sm:min-h-[42px] py-2 ${
                                packSearch && onGlobalScan ? 'pr-20 sm:pr-24' : packSearch ? 'pr-8 sm:pr-9' : 'pr-3'
                            } ${
                                scanSuccess
                                    ? '!bg-emerald-500/5 border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                    : scanError
                                        ? '!bg-red-500/5 border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                        : '!bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20'
                            }`}
                        />
                        <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 shrink-0 z-10">
                            {packSearch && (
                                <button
                                    type="button"
                                    onClick={() => setPackSearch('')}
                                    aria-label={t('warehouse.clearSearch') || 'Clear search'}
                                    className="p-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors rounded-lg cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {packSearch && onGlobalScan && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const val = packSearch.trim();
                                        if (val) onGlobalScan(val);
                                    }}
                                    disabled={isScanning}
                                    className="h-7 sm:h-8 px-2.5 sm:px-3 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                >
                                    {isScanning ? <Loader2 size={12} className="animate-spin" /> : <span>{t('warehouse.auxiliary.go') || 'Go'}</span>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Feedback Pill */}
                    {(scanSuccess || scanError) && (
                        <div className={`mt-1.5 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-150 ${
                            scanSuccess
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                            {scanSuccess ? <CheckCircle size={13} className="shrink-0" /> : <AlertTriangle size={13} className="shrink-0" />}
                            <span className="truncate">{scanSuccess || scanError}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
