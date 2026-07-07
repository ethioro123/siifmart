import React from 'react';
import { useMerchandising } from '../MerchandisingContext';

export const PricingPagination: React.FC = () => {
    const {
        filteredProducts,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage
    } = useMerchandising();

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);

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

    if (filteredProducts.length === 0) return null;

    return (
        <div className="p-6 border-t border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-stone-50/50 dark:bg-[#1E2822]/30 flex flex-wrap gap-4 items-center justify-between">
            {/* Record count info */}
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Showing{' '}
                <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                    {filteredProducts.length === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                    {endIndex}
                </span>{' '}
                of{' '}
                <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                    {filteredProducts.length}
                </span>{' '}
                products
            </div>

            <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
                {/* Page limit selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Show</span>
                    <div className="relative">
                        <select
                            className="woody-input py-1.5 pl-3 pr-8 text-xs font-semibold"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                            title="Select number of items per page"
                            aria-label="Items per page selection"
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                <option key={n} value={n} className="bg-white dark:bg-[#1E2822]">
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
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            currentPage === 1 ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed' : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                        }`}
                        title="First page"
                    >
                        ««
                    </button>

                    {/* Previous */}
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            currentPage === 1 ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed' : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                        }`}
                    >
                        Prev
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                        {getPageNumbers().map((page, idx) =>
                            typeof page === 'number' ? (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 ${
                                        currentPage === page
                                            ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                                            : 'text-stone-500 dark:text-[#7A9E83] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                                    }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={idx} className="text-stone-400 dark:text-stone-600 px-1">
                                    ...
                                </span>
                            )
                        )}
                    </div>

                    {/* Next */}
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            currentPage === totalPages
                                ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                                : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                        }`}
                    >
                        Next
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            currentPage === totalPages
                                ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                                : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                        }`}
                        title="Last page"
                    >
                        »»
                    </button>
                </div>
            </div>
        </div>
    );
};
