import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Calculate range for display
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex justify-between items-center p-4 border-t border-white/5 bg-black/20 ${className}`}>
            <div className="text-xs text-gray-400">
                {totalItems > 0 ? (
                    <>Showing <span className="text-white font-mono">{startItem}-{endItem}</span> of <span className="text-white font-mono">{formatCompactNumber(totalItems)}</span> {itemName}</>
                ) : (
                    <>No {itemName} found</>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading || totalItems === 0}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-white transition-colors border border-white/10 flex items-center gap-1"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>

                <span className="flex items-center px-3 text-xs text-gray-400 font-mono bg-black/40 rounded-lg border border-white/5">
                    {currentPage} <span className="mx-1 text-gray-600">/</span> {Math.max(1, totalPages)}
                </span>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || isLoading || totalItems === 0}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-white transition-colors border border-white/10 flex items-center gap-1"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
