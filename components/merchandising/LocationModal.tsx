import React from 'react';
import { Package, Truck, TrendingUp, TrendingDown } from 'lucide-react';
import Modal from '../Modal';
import type { Product } from '../../types';

interface LocationModalProps {
   isOpen: boolean;
   onClose: () => void;
   selectedLocationProduct: Product | null;
   products: Product[];
   sites: any[];
   allOrders: any[];
   currencySymbol?: string;
}

export const LocationModal: React.FC<LocationModalProps> = ({
   isOpen,
   onClose,
   selectedLocationProduct,
   products,
   sites,
   allOrders,
   currencySymbol = 'ETB',
}) => {
   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title="Network Stock Matrix"
         size="lg"
      >
         {selectedLocationProduct && (
            <div className="space-y-5">
               <div className="flex items-center gap-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-4 rounded-2xl">
                  <div className="w-14 h-14 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                     {selectedLocationProduct.image && !selectedLocationProduct.image.includes('placeholder.com') ? (
                        <img
                           src={selectedLocationProduct.image}
                           className="w-full h-full object-cover"
                           alt=""
                           onError={(e) => {
                              e.currentTarget.style.display = 'none';
                           }}
                        />
                     ) : (
                        <Package size={22} className="text-[var(--theme-text-secondary)]" />
                     )}
                  </div>
                  <div>
                     <h3 className="text-base font-semibold text-[var(--theme-text-primary)] leading-tight">{selectedLocationProduct.name}</h3>
                     <p className="text-[var(--theme-text-secondary)] font-mono text-xs mt-0.5">{selectedLocationProduct.sku}</p>
                  </div>
                  <div className="ml-auto text-right">
                     <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Total Network Asset</p>
                     <p className="text-xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums">
                        {products
                           .filter(p => p.sku === selectedLocationProduct.sku)
                           .reduce((sum, p) => sum + p.stock, 0)} Units
                     </p>
                  </div>
               </div>

               <div className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                  <table className="w-full text-left">
                     <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[11px] uppercase font-semibold tracking-wider">
                        <tr>
                           <th className="p-3.5">Location</th>
                           <th className="p-3.5">Type</th>
                           <th className="p-3.5 text-center">Stock Level</th>
                           <th className="p-3.5 text-right">Aisle / Shelf</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {products
                           .filter(p => p.sku === selectedLocationProduct.sku)
                           .map(p => {
                              const site = sites.find(s => s.id === p.siteId || s.id === (p as any).site_id);
                              return (
                                 <tr key={p.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                    <td className="p-3.5 font-semibold text-xs text-[var(--theme-text-primary)]">
                                       {site ? site.name : 'Unknown Site'}
                                    </td>
                                    <td className="p-3.5 text-xs text-[var(--theme-text-secondary)]">
                                       {site ? site.type : '-'}
                                       {/* --- INCOMING PO DATA --- */}
                                       {(() => {
                                          // Find all open POs for this product
                                          const openPOs = allOrders
                                             .filter(o => o.status === 'Pending' || o.status === 'Approved')
                                             .flatMap(o => o.lineItems || [])
                                             .filter(item => item.productId === p.id);

                                          const totalOnOrder = openPOs.reduce((sum, item) => sum + item.quantity, 0);
                                          const latestPO = openPOs[openPOs.length - 1];
                                          const incomingCost = latestPO ? latestPO.unitCost : 0;

                                          return (
                                             <div className="flex flex-col gap-1 mt-1">
                                                {totalOnOrder > 0 && (
                                                   <div className="text-[10px] text-[var(--theme-accent)] font-medium flex items-center gap-1 font-mono">
                                                      <Truck size={11} />
                                                      On Order: {totalOnOrder}
                                                   </div>
                                                )}
                                                {incomingCost > 0 && incomingCost !== (p.costPrice || 0) && (
                                                   <div className={`text-[10px] font-mono tabular-nums flex items-center gap-1 ${incomingCost > (p.costPrice || 0) ? 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'}`}>
                                                      {incomingCost > (p.costPrice || 0) ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                      New Cost: {currencySymbol} {(incomingCost).toFixed(2)}
                                                   </div>
                                                )}
                                             </div>
                                          );
                                       })()}
                                    </td>
                                    <td className="p-3.5 align-top text-center">
                                       <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium tabular-nums border ${p.stock < 20 ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]' : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'}`}>
                                          {p.stock} Units
                                       </span>
                                    </td>
                                    <td className="p-3.5 text-right font-mono text-xs text-[var(--theme-text-primary)]">
                                       {p.shelfPosition || <span className="text-[var(--theme-text-tertiary)] italic">Unassigned</span>}
                                    </td>
                                 </tr>
                              );
                           })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </Modal>
   );
};
