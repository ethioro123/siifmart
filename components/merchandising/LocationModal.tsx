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
}

export const LocationModal: React.FC<LocationModalProps> = ({
   isOpen,
   onClose,
   selectedLocationProduct,
   products,
   sites,
   allOrders,
}) => {
   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title="Network Stock Matrix"
         size="lg"
      >
         {selectedLocationProduct && (
            <div className="space-y-6">
               <div className="flex items-center gap-4 glass-panel-pushed p-4 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                     {selectedLocationProduct.image && !selectedLocationProduct.image.includes('placeholder.com') ? (
                        <img
                           src={selectedLocationProduct.image}
                           className="w-full h-full object-cover"
                           alt=""
                           onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                           }}
                        />
                     ) : (
                        <Package size={24} className="text-stone-500" />
                     )}
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{selectedLocationProduct.name}</h3>
                     <p className="text-stone-400 dark:text-stone-500 font-mono text-sm">{selectedLocationProduct.sku}</p>
                  </div>
                  <div className="ml-auto text-right">
                     <p className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wider">Total Network Asset</p>
                     <p className="text-2xl font-bold text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
                        {products
                           .filter(p => p.sku === selectedLocationProduct.sku)
                           .reduce((sum, p) => sum + p.stock, 0)} Units
                     </p>
                  </div>
               </div>

               <div className="overflow-hidden rounded-2xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-white/40 dark:bg-black/10">
                  <table className="w-full text-left">
                     <thead className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400 text-xs uppercase font-bold">
                        <tr>
                           <th className="p-4">Location</th>
                           <th className="p-4">Type</th>
                           <th className="p-4 text-center">Stock Level</th>
                           <th className="p-4 text-right">Aisle / Shelf</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                        {products
                           .filter(p => p.sku === selectedLocationProduct.sku)
                           .map(p => {
                              const site = sites.find(s => s.id === p.siteId || s.id === (p as any).site_id);
                              return (
                                 <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-bold text-[#1E3F27] dark:text-white">
                                       {site ? site.name : 'Unknown Site'}
                                    </td>
                                    <td className="p-4 text-sm text-stone-500 dark:text-stone-400">
                                       {site ? site.type : '-'}
                                       {/* --- INCOMING PO DATA --- */}
                                       {(() => {
                                          // Find all open POs for this product
                                          const openPOs = allOrders
                                             .filter(o => o.status === 'Pending' || o.status === 'Approved')
                                             .flatMap(o => o.lineItems || [])
                                             .filter(item => item.productId === p.id);

                                          const totalOnOrder = openPOs.reduce((sum, item) => sum + item.quantity, 0);
                                          const latestPO = openPOs[openPOs.length - 1]; // Simple latest check
                                          const incomingCost = latestPO ? latestPO.unitCost : 0;

                                          return (
                                             <div className="flex flex-col gap-1 mt-1">
                                                {totalOnOrder > 0 && (
                                                   <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold flex items-center gap-1">
                                                      <Truck size={10} />
                                                      On Order: {totalOnOrder}
                                                   </div>
                                                )}
                                                {incomingCost > 0 && incomingCost !== (p.costPrice || 0) && (
                                                   <div className={`text-[10px] flex items-center gap-1 ${incomingCost > (p.costPrice || 0) ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                      {incomingCost > (p.costPrice || 0) ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                      New Cost: ${(incomingCost).toFixed(2)}
                                                   </div>
                                                )}
                                             </div>
                                          );
                                       })()}
                                    </td>
                                    <td className="p-4 align-top text-center">
                                       <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${p.stock < 20 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'}`}>
                                          {p.stock} Units
                                       </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-[#1E3F27] dark:text-white">
                                       {p.shelfPosition || <span className="text-stone-400 dark:text-stone-600 italic">Unassigned</span>}
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
