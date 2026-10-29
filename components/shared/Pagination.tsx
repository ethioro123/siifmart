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

    if (totalItems <= 0) return null;

    const curr = Math.max(1, Number(currentPage) || 1);
    const total = Math.max(1, Number(totalPages) || 1);

    // Calculate range for display
    const startItem = (curr - 1) * itemsPerPage + 1;
    const endItem = Math.min(curr * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 p-3 sm:p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-[var(--shadow-sm)] select-none ${className}`}>

            {/* Left: Stats Display */}
            <div className="text-xs text-[var(--theme-text-secondary)] font-medium flex items-center gap-1.5">
                {language === 'or' ? (
                    <>
                        <span>{t('common.showing') || 'Showing'}</span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                            {startItem}{t('common.rangeSeparator') || '-'}{endItem}
                        </span>
                        <span>{t('common.of') || 'of'}</span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{formatCompactNumber(totalItems)}</span>
                        <span>{itemName}</span>
                        <span>{t('common.fromSuffix') || ''}</span>
                    </>
                ) : (
                    <>
                        <span>{t('common.showing') || 'Showing'}</span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                            {startItem}-{endItem}
                        </span>
                        <span>{t('common.of') || 'of'}</span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                            {formatCompactNumber(totalItems)}
                        </span>
                        <span>{itemName}</span>
                    </>
                )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, curr - 1))}
                    disabled={curr <= 1 || isLoading}
                    className="h-8 px-2.5 sm:px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1 text-xs font-medium touch-manipulation"
                    title={t('common.previousPage') || 'Previous Page'}
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">{t('common.previous') || 'Previous'}</span>
                </button>

                {/* Page Numbers — hidden on compact mobile */}
                <div className="hidden sm:flex items-center gap-1 mx-1 overflow-x-auto no-scrollbar">
                    {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, curr - 2);
                        let endPage = Math.min(total, startPage + maxVisible - 1);

                        if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        if (startPage > 1) {
                            pages.push(
                                <button
                                    key={1}
                                    type="button"
                                    onClick={() => onPageChange(1)}
                                    className="w-8 h-8 rounded-xl text-xs font-mono tabular-nums transition-all bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium active:scale-[0.98] cursor-pointer touch-manipulation"
                                >
                                    1
                                </button>
                            );
                            if (startPage > 2) {
                                pages.push(<span key="start-ellipsis" className="text-[var(--theme-text-secondary)] px-1 text-xs">...</span>);
                            }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                            const isActive = curr === i;
                            pages.push(
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onPageChange(i)}
                                    className={`w-8 h-8 rounded-xl text-xs font-mono tabular-nums transition-all active:scale-[0.98] cursor-pointer touch-manipulation ${
                                        isActive
                                            ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] font-semibold shadow-xs'
                                            : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium'
                                    }`}
                                >
                                    {i}
                                </button>
                            );
                        }

                        if (endPage < total) {
                            if (endPage < total - 1) {
                                pages.push(<span key="end-ellipsis" className="text-[var(--theme-text-secondary)] px-1 text-xs">...</span>);
                            }
                            pages.push(
                                <button
                                    key={total}
                                    type="button"
                                    onClick={() => onPageChange(total)}
                                    className="w-8 h-8 rounded-xl text-xs font-mono tabular-nums transition-all bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium active:scale-[0.98] cursor-pointer touch-manipulation"
                                >
                                    {total}
                                </button>
                            );
                        }

                        return pages;
                    })()}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(total, curr + 1))}
                    disabled={curr >= total || isLoading}
                    className="h-8 px-2.5 sm:px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1 text-xs font-medium touch-manipulation"
                    title={t('common.nextPage') || 'Next Page'}
                    aria-label="Next Page"
                >
                    <span className="hidden sm:inline">{t('common.next') || 'Next'}</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
