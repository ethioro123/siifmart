import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMerchandising } from './MerchandisingContext';
import { useData } from '../../contexts/DataContext';
import type { Product } from '../../types';
import {
   generateShelfTagsHTML,
   ShelfTagItem,
   ShelfTagMediaSize,
   isProductHalal
} from '../../utils/labels/ShelfTagGenerator';
import { printHtmlContent } from '../../utils/printHelper';
import { shelfTagsService, ShelfTagAuditRecord } from '../../services/shelf-tags.service';
import { ShelfTagParityVerifier } from './shelf-tags/ShelfTagParityVerifier';
import { ShelfTagCatalog } from './shelf-tags/ShelfTagCatalog';
import { ShelfTagAuditHistory } from './shelf-tags/ShelfTagAuditHistory';
import { ShelfTagPreviewModal } from './shelf-tags/ShelfTagPreviewModal';

export const ShelfTagsTab: React.FC = () => {
   const {
      products: globalProducts,
      currencySymbol,
      addNotification,
      activeCountry
   } = useMerchandising();

   const { activeSite, sites, setActiveSite } = useData();

   const scopeKey = `${activeCountry}_${activeSite?.id || 'all'}`;

   // Scoped products for active facility
   const scopedProducts = useMemo(() => {
      if (!activeSite?.id) return globalProducts;
      return globalProducts.filter(p => !p.siteId || p.siteId === activeSite.id);
   }, [globalProducts, activeSite?.id]);

   // Selection State
   const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
   const [mediaSize, setMediaSize] = useState<ShelfTagMediaSize>('standard-50x30');
   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
   const [isPrinting, setIsPrinting] = useState(false);

   // Audit Discrepancies State
   const [auditRecords, setAuditRecords] = useState<ShelfTagAuditRecord[]>(() =>
      shelfTagsService.getStoredAuditRecords(scopeKey)
   );

   // Scope-change reset: Clear selection & load scope-specific audits when country/site switches
   useEffect(() => {
      setSelectedProductIds(new Set());
      setAuditRecords(shelfTagsService.getStoredAuditRecords(scopeKey));
   }, [scopeKey]);

   // Selection helpers
   const toggleSelect = useCallback((id: string) => {
      setSelectedProductIds(prev => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id);
         else next.add(id);
         return next;
      });
   }, []);

   const toggleSelectAll = useCallback((allFilteredIds: string[]) => {
      setSelectedProductIds(prev => {
         const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => prev.has(id));
         if (allSelected) {
            const next = new Set(prev);
            allFilteredIds.forEach(id => next.delete(id));
            return next;
         } else {
            const next = new Set(prev);
            allFilteredIds.forEach(id => next.add(id));
            return next;
         }
      });
   }, []);

   // Queue tag from discrepancy
   const handleQueueTag = useCallback((productId: string, sku?: string) => {
      setSelectedProductIds(prev => new Set(prev).add(productId));
      addNotification('info', `Queued replacement tag for ${sku || 'item'}`);
   }, [addNotification]);

   const handleDiscrepancyDetected = useCallback((rec: ShelfTagAuditRecord, product: Product) => {
      setAuditRecords(shelfTagsService.getStoredAuditRecords(scopeKey));
      setSelectedProductIds(prev => new Set(prev).add(product.id));
   }, [scopeKey]);

   const handleUpdateAuditStatus = useCallback((id: string, status: ShelfTagAuditRecord['status']) => {
      shelfTagsService.updateAuditStatus(scopeKey, id, status);
      setAuditRecords(shelfTagsService.getStoredAuditRecords(scopeKey));
      if (status === 'verified') {
         addNotification('success', 'Discrepancy marked rechecked and verified on shelf.');
      }
   }, [scopeKey, addNotification]);

   // Prepare selected items with authoritative reload
   const getSelectedItemsForPrint = useCallback(async (): Promise<ShelfTagItem[]> => {
      const ids = Array.from(selectedProductIds);
      if (ids.length === 0) return [];

      let freshMap = new Map<string, Product>();
      try {
         if (activeSite?.id) {
            freshMap = await shelfTagsService.fetchAuthoritativeProducts(activeSite.id, ids);
         }
      } catch {
         // Fallback to scoped products if offline
      }

      return ids.map(id => {
         const p = freshMap.get(id) || scopedProducts.find(item => item.id === id);
         if (!p) return null;

         const regPrice = Math.round(Number(p.price) || 0);
         const salePr = p.salePrice && p.salePrice > 0 ? Math.round(Number(p.salePrice)) : undefined;

         return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            barcodeType: p.barcodeType,
            category: p.category,
            shelfPosition: p.shelfPosition,
            regularPrice: regPrice,
            salePrice: salePr,
            isOnSale: Boolean(p.isOnSale),
            isHalal: isProductHalal(p)
         };
      }).filter(Boolean) as ShelfTagItem[];
   }, [selectedProductIds, activeSite?.id, scopedProducts]);

   // Trigger Print Execution
   const handlePrintExecution = useCallback(async () => {
      if (selectedProductIds.size === 0) {
         addNotification('info', 'Please select at least one item to generate shelf tags.');
         return;
      }

      setIsPrinting(true);
      try {
         const itemsToPrint = await getSelectedItemsForPrint();
         if (itemsToPrint.length === 0) {
            addNotification('alert', 'No active products found for the current selection.');
            return;
         }

         const html = generateShelfTagsHTML(itemsToPrint, {
            currency: currencySymbol,
            storeName: activeSite?.name || 'SIIFMART RETAIL',
            mediaSize
         });

         const res = await printHtmlContent(html);
         if (res && !res.success && res.error) {
            addNotification('alert', `Printing alert: ${res.error}`);
         } else {
            addNotification('success', `${itemsToPrint.length} shelf tag${itemsToPrint.length > 1 ? 's' : ''} dispatched for printing`);
            setIsPreviewOpen(false);

            // Advance audit status to printed for queued items
            itemsToPrint.forEach(item => {
               const matchedAudit = auditRecords.find(r => r.productId === item.id && r.status === 'tag_queued');
               if (matchedAudit) {
                  shelfTagsService.updateAuditStatus(scopeKey, matchedAudit.id, 'printed');
               }
            });
            setAuditRecords(shelfTagsService.getStoredAuditRecords(scopeKey));
         }
      } catch (err: any) {
         addNotification('alert', `Failed to generate shelf tags: ${err.message}`);
      } finally {
         setIsPrinting(false);
      }
   }, [selectedProductIds, getSelectedItemsForPrint, currencySymbol, activeSite?.name, mediaSize, addNotification, auditRecords, scopeKey]);

   // Preview Items list
   const [previewItems, setPreviewItems] = useState<ShelfTagItem[]>([]);
   const handleOpenPreview = async () => {
      const items = await getSelectedItemsForPrint();
      if (items.length === 0) {
         addNotification('info', 'Select products to preview shelf tags.');
         return;
      }
      setPreviewItems(items);
      setIsPreviewOpen(true);
   };

   return (
      <div className="space-y-6 animate-in fade-in" aria-label="Shelf Tags and Floor Parity">
         {/* Top Stat Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
               <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Active Facility SKUs</p>
               <p className="text-2xl font-bold text-[var(--theme-text-primary)] mt-1 font-mono">{scopedProducts.length}</p>
               <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{activeSite?.name || 'All Facilities'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
               <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Promotional Shelf Items</p>
               <p className="text-2xl font-bold text-[var(--theme-status-warning-text)] mt-1 font-mono">
                  {scopedProducts.filter(p => p.isOnSale).length}
               </p>
               <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Requires sale flag tags</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
               <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Selected For Print</p>
               <p className="text-2xl font-bold text-indigo-500 mt-1 font-mono">{selectedProductIds.size}</p>
               <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Queued for thermal tag printer</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
               <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Discrepancy Alerts</p>
               <p className="text-2xl font-bold text-[var(--theme-status-danger-text)] mt-1 font-mono">
                  {auditRecords.filter(r => r.status !== 'verified').length}
               </p>
               <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Pending floor resolution</p>
            </div>
         </div>

         {/* Floor Price Parity Scanner Bar */}
         <ShelfTagParityVerifier
            activeSite={activeSite || null}
            allSites={sites || []}
            onSelectFacility={setActiveSite}
            currencySymbol={currencySymbol}
            scopeKey={scopeKey}
            onDiscrepancyDetected={handleDiscrepancyDetected}
            addNotification={addNotification}
         />

         {/* Discrepancy Lifecycle & Audit Trail */}
         <ShelfTagAuditHistory
            records={auditRecords}
            currencySymbol={currencySymbol}
            onUpdateStatus={handleUpdateAuditStatus}
            onQueueTag={handleQueueTag}
         />

         {/* Shelf Tags Catalog Table */}
         <ShelfTagCatalog
            products={scopedProducts}
            currencySymbol={currencySymbol}
            selectedIds={selectedProductIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onPruneSelection={setSelectedProductIds}
            onOpenPreview={handleOpenPreview}
            onPrintSelected={handlePrintExecution}
            isPrinting={isPrinting}
         />

         {/* Label Preview Modal */}
         <ShelfTagPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            items={previewItems}
            mediaSize={mediaSize}
            setMediaSize={setMediaSize}
            currencySymbol={currencySymbol}
            onConfirmPrint={handlePrintExecution}
            isPrinting={isPrinting}
         />
      </div>
   );
};
