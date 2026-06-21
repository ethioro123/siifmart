import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
      <div className="flex items-center justify-between p-4 bg-[#FAF8F5]/85 dark:bg-black/25 border-t border-[#E2DCCE] dark:border-white/10 select-none">
         <div className="text-xs text-stone-500 dark:text-gray-500 font-medium">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
         </div>
         <div className="flex items-center gap-2">
            <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="p-2 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#1E3F27] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
               title="Previous Page"
               aria-label="Previous Page"
            >
               <ArrowLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                     p = currentPage - 2 + i;
                  }
                  if (p > totalPages) return null;

                  return (
                     <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all border cursor-pointer ${currentPage === p
                           ? 'bg-[#224429] dark:bg-[#EAE5D9] text-white dark:text-[#1E3B24] border-[#224429] dark:border-[#EAE5D9] shadow-sm'
                           : 'bg-white dark:bg-white/5 text-stone-550 dark:text-gray-400 border-[#E2DCCE] dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/10 hover:text-[#1E3F27] dark:hover:text-white'
                           }`}
                     >
                        {p}
                     </button>
                  );
               })}
            </div>

            <button
               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
               disabled={currentPage === totalPages}
               className="p-2 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#1E3F27] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
               title="Next Page"
               aria-label="Next Page"
            >
               <ArrowRight size={16} />
            </button>
         </div>
      </div>
   );
}
