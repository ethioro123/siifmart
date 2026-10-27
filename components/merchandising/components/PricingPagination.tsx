import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMerchandising } from '../MerchandisingContext';

export const PricingPagination: React.FC = () => {
    const {
        filteredProducts, catalogCount,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage
    } = useMerchandising();

    const totalPages = Math.ceil(catalogCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, catalogCount);

    const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    if (catalogCount === 0) return null;

    return (
        <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-wrap gap-4 items-center justify-between">
            {/* Record count info */}
            <div className="text-xs text-[var(--theme-text-secondary)] font-medium">
                Showing{' '}
                <span className="font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                    {catalogCount === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                    {endIndex}
                </span>{' '}
                of{' '}
                <span className="font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                    {catalogCount}
                </span>{' '}
                products
            </div>

            <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
                {/* Page limit selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Show</span>
                    <div className="relative">
                        <select
                            className="h-8 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2.5 pr-8 text-xs font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors cursor-pointer"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                            title="Select number of items per page"
                            aria-label="Items per page selection"
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                <option key={n} value={n} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`h-8 w-8 flex items-center justify-center rounded-xl transition-colors ${
                            currentPage === 1 ? 'text-[var(--theme-text-tertiary)] opacity-40 cursor-not-allowed' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] cursor-pointer'
                        }`}
                        title="First page"
                        aria-label="First page"
                    >
                        <ChevronsLeft size={14} />
                    </button>

                    {/* Previous */}
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`h-8 px-2.5 flex items-center gap-1 rounded-xl text-xs font-medium transition-colors ${
                            currentPage === 1 ? 'text-[var(--theme-text-tertiary)] opacity-40 cursor-not-allowed' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] cursor-pointer'
                        }`}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-1">
                        {getPageNumbers().map((page, idx) =>
                            typeof page === 'number' ? (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-xl text-xs font-mono font-medium transition-all ${
                                        currentPage === page
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold shadow-sm'
                                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] cursor-pointer'
                                    }`}
                                    aria-label={`Page ${page}`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={idx} className="text-[var(--theme-text-tertiary)] px-1 font-mono text-xs">
                                    ...
                                </span>
                            )
                        )}
                    </div>

                    {/* Next */}
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`h-8 px-2.5 flex items-center gap-1 rounded-xl text-xs font-medium transition-colors ${
                            currentPage === totalPages
                                ? 'text-[var(--theme-text-tertiary)] opacity-40 cursor-not-allowed'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] cursor-pointer'
                        }`}
                        aria-label="Next page"
                    >
                        <span>Next</span>
                        <ChevronRight size={14} />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`h-8 w-8 flex items-center justify-center rounded-xl transition-colors ${
                            currentPage === totalPages
                                ? 'text-[var(--theme-text-tertiary)] opacity-40 cursor-not-allowed'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] cursor-pointer'
                        }`}
                        title="Last page"
                        aria-label="Last page"
                    >
                        <ChevronsRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
