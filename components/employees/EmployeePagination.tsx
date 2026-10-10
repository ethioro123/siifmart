import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeePaginationProps {
   currentPage: number;
   totalPages: number;
   totalCount: number;
   ITEMS_PER_PAGE: number;
   setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export default function EmployeePagination({
   currentPage, totalPages, totalCount, ITEMS_PER_PAGE, setCurrentPage
}: EmployeePaginationProps) {
   if (totalPages <= 1) return null;

   return (
      <div className="h-14 px-4 sm:px-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between select-none shadow-[var(--shadow-sm)]">
         <div className="text-xs text-[var(--theme-text-secondary)]">
            Showing <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{totalCount}</span> entries
         </div>
         <div className="flex items-center gap-1.5">
            <button
               type="button"
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="h-8 px-2.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1 text-xs font-medium"
               title="Previous Page"
               aria-label="Previous Page"
            >
               <ChevronLeft size={14} />
               <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-1">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                     p = currentPage - 2 + i;
                  }
                  if (p > totalPages) return null;

                  const isActive = currentPage === p;

                  return (
                     <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs transition-all font-mono tabular-nums cursor-pointer active:scale-[0.98] ${
                           isActive
                              ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold shadow-xs'
                              : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium'
                        }`}
                     >
                        {p}
                     </button>
                  );
               })}
            </div>

            <button
               type="button"
               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
               disabled={currentPage === totalPages}
               className="h-8 px-2.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1 text-xs font-medium"
               title="Next Page"
               aria-label="Next Page"
            >
               <span className="hidden sm:inline">Next</span>
               <ChevronRight size={14} />
            </button>
         </div>
      </div>
   );
}
