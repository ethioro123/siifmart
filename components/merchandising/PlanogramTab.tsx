import React from 'react';
import { Flame, Package, MousePointer2, Plus, RefreshCw } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';

export const PlanogramTab: React.FC = () => {
   const {
      showHeatmap,
      setShowHeatmap,
      swapSource,
      products,
      handleShelfSwap,
      handleMoveToShelf,
      setSimResult
   } = useMerchandising();

   return (
      <div className="glass-panel overflow-hidden animate-in fade-in">
         <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex justify-between items-center bg-stone-50/50 dark:bg-[#1E2822]/30">
            <div>
               <h3 className="font-bold text-[#1E3F27] dark:text-white">Interactive Shelf Map</h3>
               <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Drag (Click) to rearrange. Enable heatmap to see sales velocity.</p>
            </div>
            <button
               onClick={() => setShowHeatmap(!showHeatmap)}
               className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                  showHeatmap
                     ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10'
                     : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 border border-[#E2DCCE] dark:border-white/5'
               }`}
            >
               <Flame size={16} /> Heatmap: {showHeatmap ? 'ON' : 'OFF'}
            </button>
         </div>
         <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shelf Visualization */}
            <div className="lg:col-span-2 bg-stone-50/50 dark:bg-black/25 border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] rounded-2xl p-8 relative">
               <div className="absolute top-2 left-2 text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-mono">Zone B - Aisle 4</div>

               <div className="space-y-6 mt-4">
                  {['Top Shelf', 'Eye Level', 'Bottom Shelf'].map((shelf, shelfIdx) => (
                     <div
                        key={shelf}
                        className={`h-24 border-b-8 border-stone-400 dark:border-stone-800 flex items-end px-4 gap-4 relative ${
                           shelf === 'Eye Level' ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5' : ''
                        }`}
                     >
                        <div
                           className={`absolute -left-24 bottom-2 text-xs w-20 text-right font-bold ${
                              shelf === 'Eye Level' ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'
                           }`}
                        >
                           {shelf}
                        </div>

                        {products
                           .filter(p => p.shelfPosition === shelf || (shelf === 'Bottom Shelf' && !p.shelfPosition))
                           .slice(0, 5)
                           .map(p => {
                              const isHot = p.salesVelocity === 'High';
                              const isCold = p.salesVelocity === 'Low';
                              const isSelected = swapSource === p.id;

                              return (
                                 <div
                                    key={p.id}
                                    onClick={() => handleShelfSwap(p.id)}
                                    className={`w-16 h-20 rounded-lg transition-all cursor-pointer relative group/prod overflow-hidden border-2 ${
                                       isSelected ? 'border-yellow-400 scale-110 z-10' : 'border-transparent hover:border-stone-300 dark:hover:border-white/30'
                                    } ${
                                       showHeatmap && isHot
                                          ? 'bg-red-500/25'
                                          : showHeatmap && isCold
                                          ? 'bg-blue-500/25'
                                          : 'bg-stone-100 dark:bg-white/5'
                                    }`}
                                 >
                                    <div className="w-full h-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                       {p.image && !p.image.includes('placeholder.com') ? (
                                          <img
                                             src={p.image}
                                             className="w-full h-full object-cover opacity-85"
                                             alt=""
                                             onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                                                   '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                             }}
                                          />
                                       ) : (
                                          <Package size={32} className="text-stone-400" />
                                       )}
                                    </div>

                                    {/* Heatmap Overlay */}
                                    {showHeatmap && (
                                       <div
                                          className={`absolute inset-0 mix-blend-overlay ${
                                             isHot ? 'bg-red-500' : isCold ? 'bg-blue-500' : 'bg-transparent'
                                          }`}
                                       ></div>
                                    )}

                                    {isSelected && (
                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                          <MousePointer2 className="text-yellow-400 animate-bounce" size={16} />
                                       </div>
                                    )}
                                 </div>
                              );
                           })}

                        {/* PLACE BUTTON - Shows when item selected from sidebar */}
                        {swapSource && (
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleMoveToShelf(shelf);
                              }}
                              className="h-20 w-16 border-2 border-dashed border-[#E2DCCE] dark:border-white/20 rounded-lg flex flex-col items-center justify-center text-xs text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:bg-stone-50 dark:hover:bg-white/5 transition-all ml-2"
                              title={`Place on ${shelf}`}
                           >
                              <Plus size={16} className="mb-1" />
                              <span>Place</span>
                           </button>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            {/* Planogram Stats & Unassigned */}
            <div className="space-y-4">
               {/* Unassigned Items - DRAG SOURCE */}
               <div className="bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 sticky top-0 bg-stone-50 dark:bg-[#1E2822] pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20 flex justify-between items-center z-10">
                     <span>Unassigned ({products.filter(p => !p.shelfPosition).length})</span>
                     <span className="text-[10px] text-stone-400 dark:text-stone-500">Click to Place</span>
                  </h4>
                  <div className="space-y-2">
                     {products
                        .filter(p => !p.shelfPosition)
                        .slice(0, 10)
                        .map(p => (
                           <div
                              key={p.id}
                              onClick={() => handleShelfSwap(p.id)}
                              className={`flex items-center gap-2 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer border transition-all ${
                                 swapSource === p.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-transparent'
                              }`}
                           >
                              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                 {p.image && !p.image.includes('placeholder.com') ? (
                                    <img
                                       src={p.image}
                                       className="w-full h-full object-cover"
                                       alt=""
                                       onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          (e.currentTarget.parentElement as HTMLElement).innerHTML =
                                             '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                       }}
                                    />
                                 ) : (
                                    <Package size={14} className="text-stone-400" />
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs text-[#1E3F27] dark:text-white truncate font-medium">{p.name}</p>
                                 <p className="text-[10px] text-stone-400 dark:text-stone-500">{p.sku}</p>
                              </div>
                              {swapSource === p.id && <MousePointer2 size={12} className="text-yellow-500" />}
                           </div>
                        ))}
                     {products.filter(p => !p.shelfPosition).length > 10 && (
                        <p className="text-[10px] center text-stone-400 dark:text-stone-500 italic">
                           ...and {products.filter(p => !p.shelfPosition).length - 10} more
                        </p>
                     )}
                  </div>
               </div>

               <div className="p-4 bg-stone-50/50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20">
                  <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2">Shelf Efficiency</h4>
                  <div className="space-y-3">
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">Eye Level</span>
                           <span className="text-stone-700 dark:text-white">450 Sales/Wk</span>
                        </div>
                        <div className="w-full h-1 bg-stone-200 dark:bg-black/50 rounded-full">
                           <div className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] w-[85%] rounded-full"></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-stone-500 dark:text-stone-400">Top Shelf</span>
                           <span className="text-stone-700 dark:text-white">120 Sales/Wk</span>
                        </div>
                        <div className="w-full h-1 bg-stone-200 dark:bg-black/50 rounded-full">
                           <div className="h-full bg-stone-400 w-[30%] rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-4 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl border border-blue-500/20 dark:border-blue-500/10 text-xs text-blue-600 dark:text-blue-400">
                  <strong>Optimization Tip:</strong> 3 Low-velocity items detected on Eye Level shelf. Recommend swapping with "Neon Energy
                  Drink".
               </div>
               <button
                  onClick={() => setSimResult({ rev: 5.2, margin: 1.1 })}
                  className="woody-btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2"
               >
                  <RefreshCw size={16} /> Auto-Optimize
               </button>
            </div>
         </div>
      </div>
   );
};
