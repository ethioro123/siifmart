import React, { useState } from 'react';
import { ScanLine, CheckCircle2, AlertTriangle, X, RefreshCw, Building2 } from 'lucide-react';
import type { Product } from '../../../types';
import { shelfTagsService, ShelfTagAuditRecord } from '../../../services/shelf-tags.service';

interface ShelfTagParityVerifierProps {
   activeSite: { id: string; name: string; code?: string } | null | undefined;
   allSites: Array<{ id: string; name: string; code?: string }>;
   onSelectFacility: (siteId: string) => void;
   currencySymbol: string;
   scopeKey: string;
   onDiscrepancyDetected: (record: ShelfTagAuditRecord, product: Product) => void;
   addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

export const ShelfTagParityVerifier: React.FC<ShelfTagParityVerifierProps> = ({
   activeSite,
   allSites,
   onSelectFacility,
   currencySymbol,
   scopeKey,
   onDiscrepancyDetected,
   addNotification
}) => {
   const [auditSku, setAuditSku] = useState('');
   const [auditShelfPrice, setAuditShelfPrice] = useState('');
   const [isVerifying, setIsVerifying] = useState(false);
   const [auditResult, setAuditResult] = useState<{
      product: Product;
      status: 'MATCH' | 'DISCREPANCY';
      systemPrice: number;
      shelfPrice: number;
      variance: number;
   } | null>(null);

   const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      const skuTrimmed = auditSku.trim().toUpperCase();
      if (!skuTrimmed) {
         addNotification('alert', 'Please enter a valid product SKU.');
         return;
      }

      if (!activeSite?.id) {
         addNotification('alert', 'Floor parity verification requires an active facility/branch selection.');
         return;
      }

      // Disallow blank, zero, or decimal prices (strictly whole numbers > 0)
      const rawPrice = parseFloat(auditShelfPrice);
      if (isNaN(rawPrice) || rawPrice <= 0) {
         addNotification('alert', 'Enter a valid positive physical shelf price.');
         return;
      }
      const enteredShelfPrice = Math.round(rawPrice);

      setIsVerifying(true);
      try {
         // Reload authoritative price directly from database for this specific facility
         const freshProduct = await shelfTagsService.fetchAuthoritativeProduct(activeSite.id, skuTrimmed);
         if (!freshProduct) {
            addNotification('alert', `SKU "${skuTrimmed}" not found in facility catalog for ${activeSite.name}.`);
            setAuditResult(null);
            return;
         }

         const effectiveSysPrice = freshProduct.isOnSale && freshProduct.salePrice && freshProduct.salePrice > 0
            ? Math.round(freshProduct.salePrice)
            : Math.round(freshProduct.price);

         const isMatch = effectiveSysPrice === enteredShelfPrice;
         const variance = enteredShelfPrice - effectiveSysPrice;

         const result = {
            product: freshProduct,
            status: isMatch ? ('MATCH' as const) : ('DISCREPANCY' as const),
            systemPrice: effectiveSysPrice,
            shelfPrice: enteredShelfPrice,
            variance
         };
         setAuditResult(result);

         if (!isMatch) {
            const auditRec = shelfTagsService.saveAuditRecord(scopeKey, {
               siteId: activeSite.id,
               productId: freshProduct.id,
               sku: freshProduct.sku,
               productName: freshProduct.name,
               systemPrice: effectiveSysPrice,
               shelfPrice: enteredShelfPrice,
               variance,
               status: 'detected'
            });
            onDiscrepancyDetected(auditRec, freshProduct);
            addNotification('alert', `Price discrepancy detected for ${freshProduct.name}! POS: ${currencySymbol} ${effectiveSysPrice} vs Shelf: ${currencySymbol} ${enteredShelfPrice}`);
         } else {
            addNotification('success', `Price Parity Confirmed for ${freshProduct.sku} (${currencySymbol} ${effectiveSysPrice})`);
         }
      } catch (err: any) {
         addNotification('alert', `Verification failed: ${err.message || 'Error checking price'}`);
      } finally {
         setIsVerifying(false);
      }
   };

   return (
      <div className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs space-y-4">
         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
            <div className="flex items-center gap-2">
               <ScanLine size={18} className="text-[var(--theme-accent)]" />
               <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">Floor Price Parity Verification</h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
               <Building2 size={14} className="text-[var(--theme-text-secondary)]" />
               {activeSite ? (
                  <span className="font-semibold text-[var(--theme-text-primary)]">
                     Facility: {activeSite.name} ({activeSite.code || activeSite.id.slice(0, 6)})
                  </span>
               ) : (
                  <div className="flex items-center gap-1.5">
                     <span className="text-[var(--theme-status-warning-text)] font-medium">Select Facility:</span>
                     <select
                        onChange={(e) => onSelectFacility(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] text-xs text-[var(--theme-text-primary)]"
                     >
                        <option value="">Choose facility...</option>
                        {allSites.map((s) => (
                           <option key={s.id} value={s.id}>{s.name} ({s.code || s.id.slice(0, 6)})</option>
                        ))}
                     </select>
                  </div>
               )}
            </div>
         </div>

         <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
               <label className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] mb-1 block">
                  Scan or Enter Facility SKU
               </label>
               <input
                  type="text"
                  placeholder="e.g. ET-COFFEE-01"
                  value={auditSku}
                  onChange={(e) => setAuditSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
               />
            </div>

            <div className="w-full sm:w-48">
               <label className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] mb-1 block">
                  Observed Shelf Tag Price
               </label>
               <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-[var(--theme-text-secondary)]">
                     {currencySymbol}
                  </span>
                  <input
                     type="number"
                     step="1"
                     min="1"
                     placeholder="0"
                     value={auditShelfPrice}
                     onChange={(e) => {
                        const val = e.target.value ? Math.round(parseFloat(e.target.value)) : '';
                        setAuditShelfPrice(val.toString());
                     }}
                     className="w-full pl-8 pr-3 py-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                  />
               </div>
            </div>

            <button
               type="submit"
               disabled={isVerifying || !activeSite}
               className="px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-text-primary)] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
               {isVerifying ? (
                  <>
                     <RefreshCw size={14} className="animate-spin" />
                     <span>Checking DB...</span>
                  </>
               ) : (
                  <>
                     <CheckCircle2 size={14} />
                     <span>Verify Parity</span>
                  </>
               )}
            </button>
         </form>

         {auditResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
               auditResult.status === 'MATCH'
                  ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                  : 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
            }`}>
               <div className="flex items-center gap-2">
                  {auditResult.status === 'MATCH' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <div>
                     <span className="font-bold">{auditResult.product.name} ({auditResult.product.sku})</span>: {' '}
                     {auditResult.status === 'MATCH' ? (
                        <span>Physical tag matches live authoritative POS price ({currencySymbol} {auditResult.systemPrice}).</span>
                     ) : (
                        <span>
                           Discrepancy detected! POS Price is <strong>{currencySymbol} {auditResult.systemPrice}</strong> vs Shelf Price: <strong>{currencySymbol} {auditResult.shelfPrice}</strong> (Variance: {auditResult.variance > 0 ? `+${auditResult.variance}` : auditResult.variance}). Replacement tag queued for print.
                        </span>
                     )}
                  </div>
               </div>
               <button
                  type="button"
                  onClick={() => setAuditResult(null)}
                  className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] p-1"
               >
                  <X size={14} />
               </button>
            </div>
         )}
      </div>
   );
};
