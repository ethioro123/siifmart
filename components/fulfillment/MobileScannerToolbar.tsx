import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, SlidersHorizontal, X, Search,
    BarChart3
} from 'lucide-react';

// --- TYPES ---
interface StatItem {
    label: string;
    value: number | string;
    color: string;
}

interface FilterChip {
    label: string;
    value: string;
    isActive: boolean;
    onClick: () => void;
}

interface SortOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface SubView {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

interface MobileScannerToolbarProps {
    tabName: string;
    tabIcon: React.ReactNode;
    accentColor?: string;
    jobCount?: number;
    searchValue: string;
    onSearchChange: (val: string) => void;
    searchPlaceholder?: string;
    onScan?: (barcode: string) => void;
    scanInputRef?: React.RefObject<HTMLInputElement | null>;
    showScanInput?: boolean;
    stats?: StatItem[];
    filters?: FilterChip[];
    sortOptions?: SortOption[];
    sortValue?: string;
    onSortChange?: (val: string) => void;
    subViews?: SubView[];
    activeSubView?: string;
    onSubViewChange?: (id: string) => void;
    extraActions?: React.ReactNode;
}

const statColorMap: Record<string, string> = {
    cyan: 'text-primary',
    blue: 'text-primary',
    green: 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]',
    yellow: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
    red: 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]',
    purple: 'text-[var(--theme-text-secondary)]',
    orange: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
};

export default function MobileScannerToolbar({
    tabName,
    tabIcon,
    jobCount,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Scan barcode or search...',
    onScan,
    scanInputRef,
    showScanInput = true,
    stats,
    filters,
    sortOptions,
    sortValue,
    onSortChange,
    subViews,
    activeSubView,
    onSubViewChange,
    extraActions,
}: MobileScannerToolbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = scanInputRef || internalRef;

    // Close menu on outside click
    useEffect(() => {
        if (!isMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isMenuOpen]);

    const hasControls = (stats && stats.length > 0) || (filters && filters.length > 0) || (sortOptions && sortOptions.length > 0);
    const activeFilterCount = filters?.filter(f => f.isActive && f.value !== 'All' && f.value !== 'all').length || 0;

    return (
        <div className="md:hidden flex flex-col gap-2 relative z-30">
            {/* ROW 1: Compact Header Bar */}
            <div className="flex items-center justify-between bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl px-3 py-2 shadow-sm overflow-hidden">
                {/* Left: Icon + Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
                    <div className="w-8 h-8 min-w-[32px] rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        {tabIcon}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-tight leading-none truncate">{tabName}</p>
                        {jobCount !== undefined && (
                            <p className="text-[11px] text-[var(--theme-text-muted)] font-mono tabular-nums font-semibold uppercase tracking-wider mt-0.5">
                                {jobCount} {jobCount === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-1.5">
                    {/* Sub-view toggle */}
                    {subViews && subViews.length > 0 && (
                        <div className="flex bg-[var(--theme-bg-subtle)] rounded-xl p-0.5 border border-[var(--theme-border)]">
                            {subViews.map((sv) => {
                                const isActive = activeSubView === sv.id;
                                return (
                                    <button
                                        key={sv.id}
                                        type="button"
                                        onClick={() => onSubViewChange?.(sv.id)}
                                        className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 touch-manipulation cursor-pointer ${
                                            isActive
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        {sv.icon}
                                        <span>{sv.label}</span>
                                        {sv.count !== undefined && (
                                            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono tabular-nums ${
                                                isActive ? 'bg-[var(--theme-primary-text)]/15 text-[var(--theme-primary-text)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-muted)]'
                                            }`}>
                                                {sv.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Extra actions */}
                    {extraActions}

                    {/* Controls Toggle Button */}
                    {hasControls && (
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${
                                isMenuOpen || activeFilterCount > 0
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] shadow-sm'
                                    : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                            }`}
                            aria-label="Toggle filters and options"
                        >
                            <SlidersHorizontal size={14} />
                            {activeFilterCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-[var(--theme-primary-text)] text-[var(--theme-primary)] text-[11px] font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronDown size={12} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* ROW 2: Barcode Scanner Input */}
            {showScanInput && (
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchValue.trim() && onScan) {
                                onScan(searchValue.trim());
                            }
                        }}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-10 py-2.5 min-h-[44px] text-xs font-mono tabular-nums rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] outline-none"
                    />
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* FLOATING MENU PANEL */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    <div
                        ref={menuRef}
                        className="absolute top-full left-0 right-0 mt-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {/* Stats Row */}
                        {stats && stats.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <BarChart3 size={14} className="text-[var(--theme-text-muted)]" />
                                    <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Quick Stats</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {stats.slice(0, 6).map((stat, i) => (
                                        <div
                                            key={i}
                                            className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-center"
                                        >
                                            <p className={`text-base font-mono tabular-nums font-bold ${statColorMap[stat.color] || 'text-[var(--theme-text-primary)]'}`}>
                                                {stat.value}
                                            </p>
                                            <p className="text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider mt-0.5">
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filter Chips */}
                        {filters && filters.length > 0 && (
                            <div className="mb-4">
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 block">Filter</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {filters.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => f.onClick()}
                                            className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${f.isActive
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sort Options */}
                        {sortOptions && sortOptions.length > 0 && (
                            <div className="mb-3">
                                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 block">Sort By</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => onSortChange?.(opt.id)}
                                            className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${sortValue === opt.id
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border border-[var(--theme-primary)] shadow-sm'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] hover:text-[var(--theme-text-primary)]'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
