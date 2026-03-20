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
    cyan: { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    blue: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    green: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-green-500/20' },
    yellow: { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    red: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    orange: { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
};

const statColorMap: Record<string, string> = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
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
            <div className="flex items-center justify-between bg-[#0d0d0d]/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl px-2.5 py-2 shadow-2xl overflow-hidden">
                {/* Left: Icon + Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
                    <div className={`w-8 h-8 min-w-[32px] rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center shadow-lg ${colors.glow}`}>
                        {tabIcon}
                    </div>
                    <div>
                        <p className="text-[12px] font-black text-white uppercase tracking-tight leading-none truncate">{tabName}</p>
                        {jobCount !== undefined && (
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                {jobCount} {jobCount === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-1.5">
                    {/* Sub-view toggle (compact pill) */}
                    {subViews && subViews.length > 0 && (
                        <div className="flex bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.06]">
                            {subViews.map(sv => (
                                <button
                                    key={sv.id}
                                    type="button"
                                    onClick={() => onSubViewChange?.(sv.id)}
                                    className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap ${activeSubView === sv.id
                                        ? `bg-gradient-to-r ${colors.bg} ${colors.text} shadow-lg ${colors.glow}`
                                        : 'text-gray-500 active:bg-white/5'
                                        }`}
                                >
                                    {sv.icon}
                                    {sv.label}
                                    {sv.count !== undefined && sv.count > 0 && (
                                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black ${activeSubView === sv.id ? 'bg-white/20' : 'bg-white/[0.06]'
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
                                ? `bg-gradient-to-br ${colors.bg} ${colors.border} border ${colors.text}`
                                : 'bg-white/[0.04] border border-white/[0.06] text-gray-400'
                                }`}
                        >
                            {isMenuOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
                            {/* Badge for active filters */}
                            {activeFilterCount > 0 && !isMenuOpen && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[8px] font-black text-black flex items-center justify-center">
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
                        className={`w-full h-11 pl-10 pr-10 bg-[#0d0d0d]/95 backdrop-blur-2xl border border-white/[0.06] rounded-xl text-white font-mono text-sm focus:${colors.border} focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-gray-600`}
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 active:text-white transition-colors"
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        ref={menuRef}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#111111]/98 backdrop-blur-3xl border border-white/[0.08] rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {/* Stats Row */}
                        {stats && stats.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <BarChart3 size={12} className="text-gray-500" />
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Quick Stats</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {stats.slice(0, 6).map((stat, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-center"
                                        >
                                            <p className={`text-lg font-mono font-black ${statColorMap[stat.color] || 'text-white'}`}>
                                                {stat.value}
                                            </p>
                                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
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
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Filter</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {filters.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                f.onClick();
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${f.isActive
                                                ? `bg-gradient-to-r ${colors.bg} ${colors.text} border ${colors.border} shadow-lg`
                                                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] active:bg-white/[0.08]'
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
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Sort By</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                onSortChange?.(opt.id);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${sortValue === opt.id
                                                ? 'bg-white/10 text-white border border-white/20'
                                                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06]'
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
                            <div className="pt-3 border-t border-white/[0.06]">
                                {extraActions}
                            </div>
                        )}

                        {/* Close hint */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full mt-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-500 text-[10px] font-bold uppercase tracking-widest active:bg-white/[0.06] transition-all"
                        >
                            Done
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
