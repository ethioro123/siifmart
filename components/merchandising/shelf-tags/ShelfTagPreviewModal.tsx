import React, { useState } from 'react';
import { Printer, X, Tag, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../Modal';
import type { ShelfTagItem, ShelfTagMediaSize } from '../../../utils/labels/ShelfTagGenerator';
import { isProductHalal } from '../../../utils/labels/ShelfTagGenerator';

interface ShelfTagPreviewModalProps {
   isOpen: boolean;
   onClose: () => void;
   items: ShelfTagItem[];
   mediaSize: ShelfTagMediaSize;
   setMediaSize: (size: ShelfTagMediaSize) => void;
   currencySymbol: string;
   onConfirmPrint: () => void;
   isPrinting: boolean;
}

export const ShelfTagPreviewModal: React.FC<ShelfTagPreviewModalProps> = ({
   isOpen,
   onClose,
   items,
   mediaSize,
   setMediaSize,
   currencySymbol,
   onConfirmPrint,
   isPrinting
}) => {
   const [previewIndex, setPreviewIndex] = useState(0);

   if (!isOpen || items.length === 0) return null;

   const activeIdx = Math.min(previewIndex, items.length - 1);
   const previewItem = items[activeIdx] || items[0];
   const regularWhole = Math.round(Number(previewItem.regularPrice) || 0);
   const saleWhole = previewItem.salePrice && previewItem.salePrice > 0 ? Math.round(Number(previewItem.salePrice)) : null;
   const effectivePrice = previewItem.isOnSale && saleWhole && saleWhole > 0 ? saleWhole : regularWhole;
   const hasDiscount = Boolean(previewItem.isOnSale && saleWhole && saleWhole > 0 && saleWhole < regularWhole);
   const isHalal = isProductHalal(previewItem);

   return (
      <Modal isOpen={isOpen} onClose={onClose} title="Shelf Tag Print Preview">
         <div className="space-y-4">
            {/* Media Size Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3">
               <div>
                  <span className="text-xs font-semibold text-[var(--theme-text-primary)] block">Label Media Size</span>
                  <span className="text-[11px] text-[var(--theme-text-secondary)]">Select continuous roll or die-cut label format</span>
               </div>
               <div className="flex items-center gap-1.5">
                  {(['compact-30x20', 'standard-50x30', 'large-70x40'] as ShelfTagMediaSize[]).map((size) => (
                     <button
                        key={size}
                        type="button"
                        onClick={() => setMediaSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                           mediaSize === size
                              ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs'
                              : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                        }`}
                     >
                        {size === 'compact-30x20' ? '30×20 mm' : size === 'standard-50x30' ? '50×30 mm' : '70×40 mm'}
                     </button>
                  ))}
               </div>
            </div>

            {/* Visual Tag Mockup */}
            <div className="flex flex-col items-center justify-center p-6 bg-[var(--theme-bg-subtle)] bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)]">
               <div className="flex items-center justify-between w-full max-w-xs mb-2">
                  <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                     Sample Tag Preview ({activeIdx + 1} of {items.length})
                  </span>
                  {items.length > 1 && (
                     <div className="flex items-center gap-1">
                        <button
                           type="button"
                           disabled={activeIdx <= 0}
                           onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                           className="p-1 rounded bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] disabled:opacity-30"
                           aria-label="Previous preview tag"
                        >
                           <ChevronLeft size={12} />
                        </button>
                        <button
                           type="button"
                           disabled={activeIdx >= items.length - 1}
                           onClick={() => setPreviewIndex((i) => Math.min(items.length - 1, i + 1))}
                           className="p-1 rounded bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] disabled:opacity-30"
                           aria-label="Next preview tag"
                        >
                           <ChevronRight size={12} />
                        </button>
                     </div>
                  )}
               </div>

               <div className={`bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border-2 border-[var(--theme-border)] rounded-md p-3.5 shadow-md flex flex-col justify-between transition-all ${
                  mediaSize === 'compact-30x20' ? 'w-64 min-h-[120px]' : mediaSize === 'large-70x40' ? 'w-84 min-h-[170px]' : 'w-72 min-h-[140px]'
               }`}>
                  <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-1">
                     <span className="text-[9px] font-black uppercase tracking-wider text-[var(--theme-text-secondary)] truncate max-w-[140px]">
                        {previewItem.category || 'SIIFMART RETAIL'}
                     </span>
                     {isHalal ? (
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] rounded">
                           HALAL CERTIFIED
                        </span>
                     ) : (
                        <span className="text-[8px] font-semibold text-[var(--theme-text-muted)] uppercase">
                           SHELF TIER
                        </span>
                     )}
                  </div>

                  <div className="my-1.5">
                     <h5 className="font-bold text-xs uppercase leading-snug line-clamp-2 text-[var(--theme-text-primary)]">
                        {previewItem.name}
                     </h5>
                  </div>

                  <div className="flex items-end justify-between border-t border-b border-dashed border-[var(--theme-border)] py-1.5 my-1">
                     <div className="text-left">
                        <span className="text-[7.5px] font-bold text-[var(--theme-text-secondary)] uppercase block">LOC</span>
                        <span className="font-mono text-xs font-black">{previewItem.shelfPosition || 'STD'}</span>
                     </div>
                     <div className="text-right">
                        {hasDiscount && (
                           <span className="text-[9px] line-through text-[var(--theme-text-secondary)] font-mono block">
                              {currencySymbol} {regularWhole}
                           </span>
                        )}
                        <span className="text-xl font-black font-mono leading-none tracking-tight">
                           <span className="text-xs font-bold mr-0.5">{currencySymbol}</span>
                           {effectivePrice}
                        </span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                     <div className="h-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded px-2 flex items-center">
                        <span className="text-[8px] font-mono tracking-widest text-[var(--theme-text-secondary)]">||| |||| || |||</span>
                     </div>
                     <span className="text-[8px] font-mono font-bold text-[var(--theme-text-primary)]">
                        SKU: {previewItem.sku}
                     </span>
                  </div>
               </div>
            </div>

            {/* Print Confirmation Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border)]">
               <span className="text-xs text-[var(--theme-text-secondary)]">
                  Queued for dispatch: <strong>{items.length} tags</strong>
               </span>
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)]"
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     onClick={onConfirmPrint}
                     disabled={isPrinting}
                     className="px-5 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-text-primary)] text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                     <Printer size={15} />
                     <span>Print {items.length} Tags</span>
                  </button>
               </div>
            </div>
         </div>
      </Modal>
   );
};
