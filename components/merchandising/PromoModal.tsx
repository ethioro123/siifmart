import React, { useMemo } from 'react';
import { Loader2, Tags, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../Modal';
import type { Promotion } from '../../types';

interface PromoModalProps {
   isOpen: boolean;
   onClose: () => void;
   newPromo: Partial<Promotion>;
   setNewPromo: (promo: Partial<Promotion>) => void;
   handleCreatePromo: () => void;
   isSubmitting: boolean;
   currencySymbol?: string;
   activeCountry?: string;
   activeRegionCode?: string | null;
}

export const PromoModal: React.FC<PromoModalProps> = ({
   isOpen,
   onClose,
   newPromo,
   setNewPromo,
   handleCreatePromo,
   isSubmitting,
   currencySymbol = 'ETB',
   activeCountry = 'ET',
   activeRegionCode = null,
}) => {
   const codeTrimmed = (newPromo.code || '').trim().toUpperCase();
   const codeValid = /^[A-Z0-9_-]{3,32}$/.test(codeTrimmed);

   const rawValue = newPromo.value !== undefined && newPromo.value !== null ? Number(newPromo.value) : NaN;
   const wholeValue = !isNaN(rawValue) ? Math.round(rawValue) : 0;
   const isPercentage = newPromo.type === 'PERCENTAGE';
   const valueValid = wholeValue > 0 && (!isPercentage || wholeValue <= 100);

   const minExpiryDate = useMemo(() => {
      const d = new Date(Date.now() + 86400000);
      return d.toISOString().split('T')[0];
   }, []);

   const expiryDate = newPromo.expiryDate || '';
   const isExpiryValid = useMemo(() => {
      if (!expiryDate) return false;
      const exp = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !isNaN(exp.getTime()) && exp > today;
   }, [expiryDate]);

   const isValid = codeValid && valueValid && isExpiryValid;

   const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid || isSubmitting) return;
      handleCreatePromo();
   };

   return (
      <Modal isOpen={isOpen} onClose={onClose} title="Propose Promotional Campaign">
         <form onSubmit={onSubmit} className="space-y-4">
            {/* Promo Code */}
            <div className="space-y-1">
               <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary)]">Campaign Code</label>
                  {newPromo.code && (
                     <span className={`text-[10px] font-medium ${codeValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {codeValid ? 'Valid code' : '3-32 chars (A-Z, 0-9, -, _)'}
                     </span>
                  )}
               </div>
               <input
                  className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] uppercase font-mono font-semibold focus:outline-none focus:ring-1 transition-colors ${
                     newPromo.code && !codeValid
                        ? 'border-rose-500/60 focus:ring-rose-500'
                        : 'border-[var(--theme-border)] focus:ring-[var(--theme-accent)]'
                  }`}
                  placeholder="e.g. FLASH50, SUMMER20"
                  value={newPromo.code || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  aria-label="Campaign Code"
               />
               <p className="text-[11px] text-[var(--theme-text-muted)]">
                  Must be unique per country ({activeCountry}). Code will be upper-cased.
               </p>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary)]">Discount Type</label>
                  <select
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-colors"
                     value={newPromo.type || 'PERCENTAGE'}
                     onChange={(e) => {
                        const nextType = e.target.value as 'PERCENTAGE' | 'FIXED';
                        setNewPromo({
                           ...newPromo,
                           type: nextType,
                           value: nextType === 'PERCENTAGE' && wholeValue > 100 ? 100 : wholeValue
                        });
                     }}
                     aria-label="Discount Type"
                  >
                     <option value="PERCENTAGE">Percentage (%)</option>
                     <option value="FIXED">Fixed Amount ({currencySymbol})</option>
                  </select>
               </div>

               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-semibold text-[var(--theme-text-secondary)]">Discount Value</label>
                     {newPromo.value !== undefined && !valueValid && (
                        <span className="text-[10px] font-medium text-rose-500">
                           {isPercentage ? '1 - 100% (whole)' : '> 0 (whole)'}
                        </span>
                     )}
                  </div>
                  <input
                     type="number"
                     step="1"
                     min="1"
                     max={isPercentage ? 100 : undefined}
                     className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-mono font-medium tabular-nums focus:outline-none focus:ring-1 transition-colors ${
                        newPromo.value !== undefined && !valueValid
                           ? 'border-rose-500/60 focus:ring-rose-500'
                           : 'border-[var(--theme-border)] focus:ring-[var(--theme-accent)]'
                     }`}
                     value={newPromo.value !== undefined ? newPromo.value : ''}
                     onChange={(e) => {
                        const val = e.target.value ? Math.round(parseFloat(e.target.value)) : 0;
                        setNewPromo({ ...newPromo, value: val });
                     }}
                     placeholder="0"
                     aria-label="Discount Value"
                  />
                  <p className="text-[11px] text-[var(--theme-text-muted)]">
                     Whole numbers strictly required (no decimals).
                  </p>
               </div>
            </div>

            {/* Expiration Date */}
            <div className="space-y-1">
               <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--theme-text-secondary)]">Expiration Date</label>
                  {expiryDate && (
                     <span className={`text-[10px] font-medium ${isExpiryValid ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isExpiryValid ? 'Valid date' : 'Must be future date'}
                     </span>
                  )}
               </div>
               <input
                  type="date"
                  min={minExpiryDate}
                  className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] font-medium focus:outline-none focus:ring-1 transition-colors ${
                     expiryDate && !isExpiryValid
                        ? 'border-rose-500/60 focus:ring-rose-500'
                        : 'border-[var(--theme-border)] focus:ring-[var(--theme-accent)]'
                  }`}
                  value={newPromo.expiryDate || ''}
                  onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                  aria-label="Campaign Expiry"
               />
            </div>

            {/* Review Proposal Summary */}
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] p-3.5 text-xs space-y-2">
               <div className="flex items-center gap-2 font-semibold text-[var(--theme-text-primary)]">
                  <Tags size={14} className="text-[var(--theme-accent)]" />
                  <span>Proposal Review Summary</span>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--theme-text-secondary)]">
                  <div>
                     <span className="block text-[var(--theme-text-muted)]">Target Scope</span>
                     <span className="font-semibold text-[var(--theme-text-primary)]">
                        {activeCountry} {activeRegionCode ? `· Region ${activeRegionCode}` : '· National'}
                     </span>
                  </div>
                  <div>
                     <span className="block text-[var(--theme-text-muted)]">Proposed Benefit</span>
                     <span className="font-semibold text-[var(--theme-text-primary)] font-mono">
                        {wholeValue > 0 ? (
                           isPercentage ? `${wholeValue}% OFF` : `${currencySymbol} ${wholeValue} OFF`
                        ) : '—'}
                     </span>
                  </div>
               </div>
               <div className="border-t border-[var(--theme-border)] pt-2 text-[10px] text-[var(--theme-text-muted)] flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-[var(--theme-accent)] shrink-0 mt-0.5" />
                  <span>
                     Submitting records this campaign proposal in governance review. Merchandising plan approval records the strategic plan; POS activation remains a separate scheduled deployment.
                  </span>
               </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
               <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-opacity disabled:opacity-40"
               >
                  {isSubmitting ? (
                     <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting Proposal...</span>
                     </>
                  ) : (
                     <>
                        <Tags size={15} />
                        <span>Submit Campaign Proposal</span>
                     </>
                  )}
               </button>
            </div>
         </form>
      </Modal>
   );
};
