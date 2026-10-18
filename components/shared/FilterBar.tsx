import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: React.ReactNode;
    actions?: React.ReactNode;
    resultCount?: number;
    onClearFilters?: () => void;
    showClearButton?: boolean;
}

export default function FilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    actions,
    resultCount,
    onClearFilters,
    showClearButton = false
}: FilterBarProps) {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 space-y-3 shadow-sm">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
                {onSearchChange && (
                    <div className="flex items-center bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] focus-within:border-[var(--theme-border-focus)] rounded-xl px-4 py-2 flex-1 transition-colors">
                        <Search className="w-4 h-4 text-[var(--theme-text-muted)]" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="bg-transparent border-none ml-3 flex-1 text-[var(--theme-text-primary)] outline-none placeholder-[var(--theme-text-muted)] text-sm"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchValue && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
                {resultCount !== undefined && (
                    <div className="text-xs text-[var(--theme-text-secondary)] font-mono whitespace-nowrap">
                        {resultCount} {resultCount === 1 ? 'item' : 'items'}
                    </div>
                )}
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Filters Row */}
            {filters && (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Filters:</span>
                    {filters}
                    {showClearButton && onClearFilters && (
                        <button
                            onClick={onClearFilters}
                            className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] underline transition-colors cursor-pointer"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
