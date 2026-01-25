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
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border border-white/5 bg-black/40 backdrop-blur-md rounded-2xl shadow-xl ${className}`}>

            {/* Left: Stats Display */}
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                {totalItems > 0 ? (
                    <div className="flex items-center gap-2">
                        <span>Showing</span>
                        <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">{startItem}-{endItem}</span>
                        <span>of</span>
                        <span className="text-cyan-400 font-mono text-xs">{formatCompactNumber(totalItems)}</span>
                        <span>{itemName}</span>
                    </div>
                ) : (
                    <span>No {itemName} available</span>
                )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading || totalItems === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-black text-gray-400 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-all active:scale-95"
                    title="Previous Page"
                >
                    <ChevronLeft size={16} strokeWidth={3} />
                </button>

                <div className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                    Page <span className="text-white text-sm mx-1">{currentPage}</span> / {Math.max(1, totalPages)}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || isLoading || totalItems === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-black text-gray-400 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-all active:scale-95"
                    title="Next Page"
                >
                    <ChevronRight size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
