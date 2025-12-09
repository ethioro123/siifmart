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
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 space-y-3">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
                {onSearchChange && (
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex-1">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500 text-sm"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchValue && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
                {resultCount !== undefined && (
                    <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
                        {resultCount} {resultCount === 1 ? 'item' : 'items'}
                    </div>
                )}
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Filters Row */}
            {filters && (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-500 font-bold uppercase">Filters:</span>
                    {filters}
                    {showClearButton && onClearFilters && (
                        <button
                            onClick={onClearFilters}
                            className="text-xs text-gray-400 hover:text-white underline transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
