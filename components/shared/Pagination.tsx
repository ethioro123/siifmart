import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCompactNumber } from '../../utils/formatting';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    className?: string;
    itemName?: string; // e.g. "records", "items", "jobs"
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    isLoading = false,
    className = '',
    itemName = 'records'
}: PaginationProps) {
    const { t, language } = useLanguage();

    // Calculate range for display
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-row justify-between items-center gap-2 md:gap-4 p-3 md:p-4 border border-white/5 bg-black/40 backdrop-blur-md rounded-xl md:rounded-2xl shadow-xl ${className}`}>

            {/* Left: Stats Display */}
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                {totalItems > 0 ? (
                    language === 'or' ? (
                        <div className="flex items-center gap-2">
                            <span>{t('common.showing')}</span>
                            <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                                {startItem}{t('common.rangeSeparator')}{endItem}
                            </span>
                            <span>{t('common.of')}</span>
                            <span>{itemName}</span>
                            <span className="text-cyan-400 font-mono text-xs">{formatCompactNumber(totalItems)}</span>
                            <span>{t('common.fromSuffix')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>{t('common.showing')}</span>
                            <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">{startItem}-{endItem}</span>
                            <span>{t('common.of')}</span>
                            <span className="text-cyan-400 font-mono text-xs">{formatCompactNumber(totalItems)}</span>
                            <span>{itemName}</span>
                        </div>
                    )
                ) : (
                    <span>{t('common.noAvailable').replace('{item}', itemName)}</span>
                )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 relative z-50">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1 || isLoading}
                    className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-black text-gray-400 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                </button>

                {/* Page Numbers — hidden on mobile, just show prev/next */}
                <div className="hidden md:flex items-center gap-1 mx-2 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                    {(() => {
                        const pages = [];
                        // Responsive max visible pages
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                        if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        // First page
                        if (startPage > 1) {
                            pages.push(
                                <button
                                    key={1}
                                    type="button"
                                    onClick={() => onPageChange(1)}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    1
                                </button>
                            );
                            if (startPage > 2) {
                                pages.push(<span key="start-ellipsis" className="text-gray-600 flex-shrink-0">...</span>);
                            }
                        }

                        // Middle pages
                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onPageChange(i)}
                                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === i
                                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {i}
                                </button>
                            );
                        }

                        // Last page
                        if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                                pages.push(<span key="end-ellipsis" className="text-gray-600 flex-shrink-0">...</span>);
                            }
                            pages.push(
                                <button
                                    key={totalPages}
                                    type="button"
                                    onClick={() => onPageChange(totalPages)}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    {totalPages}
                                </button>
                            );
                        }

                        return pages;
                    })()}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (currentPage < totalPages) {
                            onPageChange(currentPage + 1);
                        }
                    }}
                    disabled={currentPage >= totalPages || isLoading}
                    className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-black text-gray-400 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed border border-white/20"
                    title="Next Page"
                >
                    <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
