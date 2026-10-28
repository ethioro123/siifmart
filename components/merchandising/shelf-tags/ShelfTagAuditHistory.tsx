import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Clock, Printer, Check } from 'lucide-react';
import type { ShelfTagAuditRecord } from '../../../services/shelf-tags.service';

interface ShelfTagAuditHistoryProps {
   records: ShelfTagAuditRecord[];
   currencySymbol: string;
   onUpdateStatus: (id: string, status: ShelfTagAuditRecord['status']) => void;
   onQueueTag: (productId: string, sku?: string) => void;
}

export const ShelfTagAuditHistory: React.FC<ShelfTagAuditHistoryProps> = ({
   records,
   currencySymbol,
   onUpdateStatus,
   onQueueTag
}) => {
   if (records.length === 0) return null;

   return (
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 shadow-xs space-y-4">
         <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
            <div className="flex items-center gap-2">
               <ShieldCheck size={18} className="text-[var(--theme-accent)]" />
               <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">Discrepancy Audit & Resolution Trail</h4>
            </div>
            <span className="text-xs text-[var(--theme-text-secondary)]">
               {records.filter(r => r.status !== 'verified').length} Open Discrepancies
            </span>
         </div>

         <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-[var(--theme-border)]">
            <table className="w-full text-left text-xs">
               <thead>
                  <tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)] text-[10px] uppercase font-bold text-[var(--theme-text-secondary)]">
                     <th className="p-3">Logged</th>
                     <th className="p-3">Product / SKU</th>
                     <th className="p-3 text-right">POS Price</th>
                     <th className="p-3 text-right">Shelf Price</th>
                     <th className="p-3 text-center">Variance</th>
                     <th className="p-3 text-center">Lifecycle Status</th>
                     <th className="p-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--theme-border)]">
                  {records.map((rec) => {
                     const isVerified = rec.status === 'verified';
                     const isPrinted = rec.status === 'printed';
                     const isQueued = rec.status === 'tag_queued';
                     const isDetected = rec.status === 'detected';

                     return (
                        <tr key={rec.id} className="hover:bg-[var(--theme-bg-panel-hover)]">
                           <td className="p-3 text-[var(--theme-text-muted)] whitespace-nowrap">
                              {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </td>
                           <td className="p-3">
                              <span className="font-semibold text-[var(--theme-text-primary)] block">{rec.productName}</span>
                              <span className="font-mono text-[10px] text-[var(--theme-text-muted)]">{rec.sku}</span>
                           </td>
                           <td className="p-3 text-right font-mono font-bold text-[var(--theme-text-primary)]">
                              {currencySymbol} {rec.systemPrice}
                           </td>
                           <td className="p-3 text-right font-mono font-bold text-rose-500">
                              {currencySymbol} {rec.shelfPrice}
                           </td>
                           <td className="p-3 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                 rec.variance > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                 {rec.variance > 0 ? `+${rec.variance}` : rec.variance}
                              </span>
                           </td>
                           <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                 isVerified
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : isPrinted
                                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                    : isQueued
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                 {isVerified && <CheckCircle2 size={10} />}
                                 {isPrinted && <Printer size={10} />}
                                 {isQueued && <Clock size={10} />}
                                 {isDetected && <AlertCircle size={10} />}
                                 {rec.status.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                 {!isVerified && (
                                    <>
                                       {rec.status !== 'tag_queued' && rec.status !== 'printed' && (
                                          <button
                                             type="button"
                                             onClick={() => {
                                                onQueueTag(rec.productId, rec.sku);
                                                onUpdateStatus(rec.id, 'tag_queued');
                                             }}
                                             className="px-2.5 py-1 rounded-lg border border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]"
                                          >
                                             Queue Tag
                                          </button>
                                       )}
                                       <button
                                          type="button"
                                          onClick={() => onUpdateStatus(rec.id, 'verified')}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                                       >
                                          <Check size={11} /> Mark Verified
                                       </button>
                                    </>
                                 )}
                                 {isVerified && (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                       Resolved
                                    </span>
                                 )}
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
   );
};
