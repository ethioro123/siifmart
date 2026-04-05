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
      <div className="flex items-center justify-between p-4 bg-black/30 border-t border-white/5">
         <div className="text-xs text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
         </div>
         <div className="flex items-center gap-2">
            <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
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
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${currentPage === p
                           ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                           : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
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
               className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
               title="Next Page"
               aria-label="Next Page"
            >
               <ArrowRight size={16} />
            </button>
         </div>
      </div>
   );
}
