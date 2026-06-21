import React, { useState, useRef, useEffect } from 'react';
import {
    Scan, ChevronDown, SlidersHorizontal, X, Search,
    LayoutGrid, History as HistoryIcon, BarChart3
} from 'lucide-react';

// --- TYPES ---
interface StatItem {
    label: string;
    value: number | string;
    color: string; // tailwind color name like 'cyan', 'yellow', 'green', 'blue', 'red', 'purple'
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
    // Identity
    tabName: string;
    tabIcon: React.ReactNode;
    accentColor?: string; // e.g. 'cyan', 'blue', 'green', 'purple'
    jobCount?: number;

    // Search / Scanner
    searchValue: string;
    onSearchChange: (val: string) => void;
    searchPlaceholder?: string;
    onScan?: (barcode: string) => void;
    scanInputRef?: React.RefObject<HTMLInputElement | null>;
    showScanInput?: boolean;

    // Stats
    stats?: StatItem[];

    // Filters
    filters?: FilterChip[];

    // Sort
    sortOptions?: SortOption[];
    sortValue?: string;
    onSortChange?: (val: string) => void;

    // Sub-view toggle (Active/History)
    subViews?: SubView[];
    activeSubView?: string;
    onSubViewChange?: (id: string) => void;

    // Extra action buttons
    extraActions?: React.ReactNode;
}

// --- COLOR MAP ---
const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    cyan: { bg: 'from-[#2C5E3B]/20 to-[#1E3F27]/10', border: 'border-[#2C5E3B]/30', text: 'text-[#2C5E3B] dark:text-[#A9CBA2]', glow: 'shadow-[#2C5E3B]/5' },
    blue: { bg: 'from-emerald-800/20 to-emerald-950/10', border: 'border-emerald-600/30', text: 'text-[#2C5E3B] dark:text-[#A9CBA2]', glow: 'shadow-emerald-900/5' },
    green: { bg: 'from-emerald-700/20 to-emerald-900/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-[#A9CBA2]', glow: 'shadow-emerald-800/5' },
    yellow: { bg: 'from-amber-600/20 to-amber-800/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', glow: 'shadow-amber-800/5' },
    red: { bg: 'from-red-600/20 to-red-800/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-400', glow: 'shadow-red-850/5' },
    purple: { bg: 'from-stone-600/20 to-stone-800/10', border: 'border-stone-500/30', text: 'text-stone-700 dark:text-stone-300', glow: 'shadow-stone-800/5' },
    orange: { bg: 'from-orange-600/20 to-orange-850/10', border: 'border-orange-500/30', text: 'text-orange-700 dark:text-orange-400', glow: 'shadow-orange-850/5' },
};

const statColorMap: Record<string, string> = {
    cyan: 'text-[#2C5E3B] dark:text-[#A9CBA2]',
    blue: 'text-[#2C5E3B] dark:text-[#A9CBA2]',
    green: 'text-emerald-600 dark:text-[#A9CBA2]',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-stone-600 dark:text-stone-300',
    orange: 'text-orange-600 dark:text-orange-400',
};

// --- MAIN COMPONENT ---
export default function MobileScannerToolbar({
    tabName,
    tabIcon,
    accentColor = 'cyan',
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
    const [isSortOpen, setIsSortOpen] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = scanInputRef || internalRef;

    const colors = colorMap[accentColor] || colorMap.cyan;

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
            {/* ═══════════════════════════════════════════════ */}
            {/* ROW 1: Compact Header Bar                       */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="flex items-center justify-between glass-panel px-3 py-2 shadow-md overflow-hidden">
                {/* Left: Icon + Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
                    <div className={`w-8 h-8 min-w-[32px] rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center shadow-sm`}>
                        {tabIcon}
                    </div>
                    <div>
                        <p className="text-[12px] font-black text-stone-850 dark:text-[#EAE5D9] uppercase tracking-tight leading-none truncate">{tabName}</p>
                        {jobCount !== undefined && (
                            <p className="text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-0.5">
                                {jobCount} {jobCount === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-1.5">
                    {/* Sub-view toggle (compact pill) */}
                    {subViews && subViews.length > 0 && (
                        <div className="flex bg-stone-100/50 dark:bg-black/20 rounded-xl p-0.5 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                            {subViews.map(sv => (
                                <button
                                    key={sv.id}
                                    type="button"
                                    onClick={() => onSubViewChange?.(sv.id)}
                                    className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap ${activeSubView === sv.id
                                        ? `bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm`
                                        : 'text-stone-400 dark:text-stone-500 active:bg-stone-200/50 dark:active:bg-white/5'
                                        }`}
                                >
                                    {sv.icon}
                                    {sv.label}
                                    {sv.count !== undefined && sv.count > 0 && (
                                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeSubView === sv.id ? 'bg-white/20' : 'bg-stone-200/50 dark:bg-white/[0.06]'
                                            }`}>
                                            {sv.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* FAB Menu Button */}
                    {hasControls && (
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            title="Toggle controls menu"
                            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isMenuOpen
                                ? `bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border border-[#2C5E3B] dark:border-[#EAE5D9]`
                                : 'bg-stone-100/40 dark:bg-black/20 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-stone-400 dark:text-stone-550'
                                }`}
                        >
                            {isMenuOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
                            {/* Badge for active filters */}
                            {activeFilterCount > 0 && !isMenuOpen && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] text-[8px] font-black text-white dark:text-black flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* ROW 2: Scanner/Search Input (Always Visible)    */}
            {/* ═══════════════════════════════════════════════ */}
            {showScanInput && (
                <div className="relative group">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text} transition-colors`}>
                        <Scan size={18} />
                    </div>
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-11 pl-10 pr-10 woody-input font-mono"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim();
                                if (val && onScan) {
                                    onScan(val);
                                    e.currentTarget.value = '';
                                    onSearchChange('');
                                }
                            }
                        }}
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            title="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-550 active:text-stone-800 dark:active:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* FLOATING MENU PANEL                             */}
            {/* ═══════════════════════════════════════════════ */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        ref={menuRef}
                        className="absolute top-full left-0 right-0 mt-2 glass-panel p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {/* Stats Row */}
                        {stats && stats.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <BarChart3 size={12} className="text-stone-400 dark:text-stone-500" />
                                    <span className="text-[9px] font-black text-stone-400 dark:text-stone-550 uppercase tracking-[0.2em]">Quick Stats</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {stats.slice(0, 6).map((stat, i) => (
                                        <div
                                            key={i}
                                            className="bg-stone-100/30 dark:bg-white/[0.02] border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] rounded-xl px-3 py-2 text-center"
                                        >
                                            <p className={`text-lg font-mono font-black ${statColorMap[stat.color] || 'text-[#1E3F27] dark:text-[#EAE5D9]'}`}>
                                                {stat.value}
                                            </p>
                                            <p className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
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
                                <span className="text-[9px] font-black text-stone-400 dark:text-stone-550 uppercase tracking-[0.2em] mb-2 block">Filter</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {filters.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                f.onClick();
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${f.isActive
                                                ? `bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border border-[#2C5E3B] dark:border-[#EAE5D9] shadow-sm`
                                                : 'bg-stone-50/50 dark:bg-[#18201B]/50 text-stone-500 dark:text-stone-400 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] active:bg-stone-100/50 dark:active:bg-[#EAE5D9]/10'
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
                                <span className="text-[9px] font-black text-stone-400 dark:text-stone-550 uppercase tracking-[0.2em] mb-2 block">Sort By</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                onSortChange?.(opt.id);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${sortValue === opt.id
                                                ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'
                                                : 'bg-stone-50/50 dark:bg-[#18201B]/50 text-stone-500 dark:text-stone-400 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]'
                                                }`}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Extra Actions */}
                        {extraActions && (
                            <div className="pt-3 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04]">
                                {extraActions}
                            </div>
                        )}

                        {/* Close hint */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full mt-3 woody-btn-secondary py-2 text-[10px] uppercase font-bold"
                        >
                            Done
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
